import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import {
  Currency,
  FulfillmentStatus,
  LedgerAccount,
  LedgerSide,
  LedgerTransactionType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PlanInterval,
  PayoutStatus,
  Prisma,
  SubscriptionStatus,
} from "@/lib/prisma/generated";
import { canMerchantSell } from "@/actions/merchant.actions/merchant.helpers";
import {
  initializePaystackTransaction,
  initiatePaystackTransfer,
  PaystackApiError,
  verifyPaystackTransaction,
  verifyPaystackTransfer,
} from "@/lib/payments/paystack-api";

export type PublicOrderInput = {
  productId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  lang?: string;
};

const deliveryTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export class MarketplacePaymentService {
  async createCheckout(input: PublicOrderInput) {
    const buyerName = input.buyerName.trim();
    const buyerEmail = input.buyerEmail.trim().toLowerCase();
    const quantity = input.quantity;

    if (!buyerName || buyerName.length > 120) {
      throw new Error("Enter your name to continue");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      throw new Error("Enter a valid email address");
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("Quantity must be between 1 and 99");
    }

    const product = await prisma.product.findFirst({
      where: {
        id: input.productId,
        isActive: true,
        user: { status: "ACTIVE" },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
              select: { status: true, plan: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!product) throw new Error("Product is no longer available");
    if (!canMerchantSell(product.user.subscriptions)) {
      throw new Error("This merchant is not enabled for online payments");
    }

    const unitPrice = product.price.toNumber();
    const total = Number((unitPrice * quantity).toFixed(2));
    if (!Number.isSafeInteger(Math.round(total * 100))) {
      throw new Error("Order amount is outside the supported range");
    }

    const orderId = randomUUID().replaceAll("-", "");
    const reference = `loci-${randomUUID()}`;
    const deliveryToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const reserved = await tx.product.updateMany({
        where: {
          id: product.id,
          isActive: true,
          stockQty: { gte: quantity },
        },
        data: { stockQty: { decrement: quantity } },
      });

      if (reserved.count !== 1)
        throw new Error("Not enough stock is available");

      await tx.order.create({
        data: {
          id: orderId,
          userId: product.userId,
          status: OrderStatus.PENDING,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          currency: product.currency,
          total,
          platformFee: 0,
          buyerName,
          buyerEmail,
          buyerPhone: input.buyerPhone?.trim() || null,
          deliveryTokenHash: deliveryTokenHash(deliveryToken),
          deliveryTokenExpiresAt: expiresAt,
          payments: {
            create: {
              transactionId: reference,
              paymentMethod: PaymentMethod.PAYSTACK,
              amount: total,
              currency: product.currency,
              status: PaymentStatus.PENDING,
            },
          },
          items: {
            create: {
              productId: product.id,
              name: product.name,
              quantity,
              unitPrice,
              total,
            },
          },
        },
      });
    });

    const callbackUrl = new URL(
      `/${encodeURIComponent(input.lang || "en")}/order/confirmation`,
      process.env.NEXTAUTH_URL,
    );
    callbackUrl.searchParams.set("token", deliveryToken);

    let checkout: Awaited<ReturnType<typeof initializePaystackTransaction>>;
    try {
      checkout = await initializePaystackTransaction({
        email: buyerEmail,
        amount: total,
        currency: product.currency,
        reference,
        callbackUrl: callbackUrl.toString(),
        metadata: { orderId, merchantId: product.userId },
      });
    } catch (error) {
      if (error instanceof PaystackApiError && error.outcomeUnknown) {
        await prisma.payment.update({
          where: { transactionId: reference },
          data: { metadata: { initializationOutcomeUnknown: true } },
        });
        throw new Error(
          `Checkout status is being reconciled. Do not retry yet. Order reference: ${orderId}`,
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { transactionId: reference, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        });
        await tx.order.updateMany({
          where: { id: orderId, status: OrderStatus.PENDING },
          data: {
            status: OrderStatus.CANCELLED,
            fulfillmentStatus: FulfillmentStatus.CANCELLED,
          },
        });
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { increment: quantity } },
        });
      });
      throw error;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentLink: checkout.authorization_url },
    });

    return { orderId, authorizationUrl: checkout.authorization_url };
  }

  async confirmPublicPayment(token: string, reference: string) {
    if (!token || !reference)
      throw new Error("Invalid payment confirmation link");

    const order = await prisma.order.findFirst({
      where: {
        deliveryTokenHash: deliveryTokenHash(token),
        deliveryTokenExpiresAt: { gt: new Date() },
        payments: { some: { transactionId: reference } },
      },
      include: { payments: { where: { transactionId: reference }, take: 1 } },
    });
    const payment = order?.payments[0];

    if (!order || !payment) throw new Error("Order was not found");
    if (payment.status === PaymentStatus.SUCCESS) return order.id;
    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error("This payment is not awaiting confirmation");
    }

    const verified = await verifyPaystackTransaction(reference);
    if (
      verified.status !== "success" ||
      verified.reference !== reference ||
      verified.amount !== Math.round(payment.amount.toNumber() * 100) ||
      verified.currency !== payment.currency
    ) {
      throw new Error("Paystack could not verify this payment");
    }

    await this.markPaymentSuccessful(reference, verified);
    return order.id;
  }

  async markPaymentSuccessful(
    reference: string,
    verified?: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at?: string;
    },
  ) {
    const payment = await prisma.payment.findUnique({
      where: { transactionId: reference },
      include: { order: true },
    });

    if (!payment) {
      const subscriptionPayment = await prisma.subscriptionPayment.findUnique({
        where: { transactionId: reference },
      });
      if (!subscriptionPayment) throw new Error("Payment reference not found");
      if (
        !verified ||
        verified.status !== "success" ||
        verified.reference !== reference ||
        verified.amount !==
          Math.round(subscriptionPayment.amount.toNumber() * 100) ||
        verified.currency !== subscriptionPayment.currency
      ) {
        throw new Error(
          "Verified subscription payment does not match the pending charge",
        );
      }

      await prisma.$transaction(async (tx) => {
        const claimed = await tx.subscriptionPayment.updateMany({
          where: {
            id: subscriptionPayment.id,
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: verified.paid_at ? new Date(verified.paid_at) : new Date(),
          },
        });
        if (claimed.count === 0) return;

        const subscription = await tx.subscription.findUniqueOrThrow({
          where: { id: subscriptionPayment.subscriptionId },
        });
        const periodStart = verified.paid_at
          ? new Date(verified.paid_at)
          : new Date();
        const nextPeriodEnd = new Date(periodStart);
        if (subscription.interval === PlanInterval.MONTHLY) {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        } else {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        }

        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: periodStart,
            currentPeriodEnd: nextPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });
      });
      return;
    }

    if (
      !verified ||
      verified.status !== "success" ||
      verified.reference !== reference ||
      verified.amount !== Math.round(payment.amount.toNumber() * 100) ||
      verified.currency !== payment.currency
    ) {
      throw new Error("Verified payment does not match the pending order");
    }

    if (payment.status === PaymentStatus.SUCCESS) return;

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: verified.paid_at ? new Date(verified.paid_at) : new Date(),
        },
      });
      if (claimed.count === 0) return;

      const updatedOrder = await tx.order.updateMany({
        where: { id: payment.orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.PAID },
      });
      if (updatedOrder.count !== 1) {
        throw new Error("Order is not in a payable state");
      }

      const sellerPayable = payment.amount.minus(payment.order.platformFee);
      const transaction = await tx.ledgerTransaction.create({
        data: {
          eventKey: `charge:${reference}`,
          type: LedgerTransactionType.PAYMENT_RECEIVED,
          orderId: payment.orderId,
          lines: {
            create: [
              {
                account: LedgerAccount.PAYMENT_CLEARING,
                side: LedgerSide.DEBIT,
                amount: payment.amount,
                currency: payment.currency,
              },
              {
                account: LedgerAccount.SELLER_PAYABLE,
                side: LedgerSide.CREDIT,
                amount: sellerPayable,
                currency: payment.currency,
              },
              ...(payment.order.platformFee.greaterThan(0)
                ? [
                    {
                      account: LedgerAccount.PLATFORM_REVENUE,
                      side: LedgerSide.CREDIT,
                      amount: payment.order.platformFee,
                      currency: payment.currency,
                    },
                  ]
                : []),
            ],
          },
        },
      });

      if (!transaction.id)
        throw new Error("Failed to record payment ledger entries");
    });
  }

  async markPaymentFailed(reference: string) {
    const payment = await prisma.payment.findUnique({
      where: { transactionId: reference },
      include: { order: { include: { items: true } } },
    });
    if (payment) {
      await prisma.$transaction(async (tx) => {
        const changed = await tx.payment.updateMany({
          where: { id: payment.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        });
        if (changed.count !== 1) return;

        const cancelled = await tx.order.updateMany({
          where: { id: payment.orderId, status: OrderStatus.PENDING },
          data: {
            status: OrderStatus.CANCELLED,
            fulfillmentStatus: FulfillmentStatus.CANCELLED,
          },
        });
        if (cancelled.count !== 1) return;

        for (const item of payment.order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { increment: item.quantity } },
            });
          }
        }
      });
      return;
    }

    const subscriptionPayment = await prisma.subscriptionPayment.findUnique({
      where: { transactionId: reference },
      select: { id: true, subscriptionId: true },
    });
    if (!subscriptionPayment) return;

    await prisma.$transaction([
      prisma.subscriptionPayment.updateMany({
        where: { id: subscriptionPayment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      }),
      prisma.subscription.updateMany({
        where: {
          id: subscriptionPayment.subscriptionId,
          status: SubscriptionStatus.INCOMPLETE,
        },
        data: { status: SubscriptionStatus.PAST_DUE },
      }),
    ]);
  }

  async confirmDelivery(token: string) {
    if (!token) throw new Error("Invalid delivery confirmation link");

    const order = await prisma.order.findFirst({
      where: {
        deliveryTokenHash: deliveryTokenHash(token),
        deliveryTokenExpiresAt: { gt: new Date() },
        status: OrderStatus.PAID,
        disputeOpenedAt: null,
      },
      select: { id: true, deliveryConfirmedAt: true },
    });
    if (!order)
      throw new Error("Order is not eligible for delivery confirmation");

    await prisma.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PAID,
        deliveryConfirmedAt: null,
        disputeOpenedAt: null,
      },
      data: {
        fulfillmentStatus: FulfillmentStatus.DELIVERED,
        deliveryConfirmedAt: new Date(),
        payoutStatus: PayoutStatus.ON_HOLD,
      },
    });

    return order.id;
  }

  async openBuyerDispute(token: string, reason: string) {
    const disputeReason = reason.trim().slice(0, 1000);
    if (!token || disputeReason.length < 5) {
      throw new Error("Provide a valid order link and a short dispute reason");
    }

    const result = await prisma.order.updateMany({
      where: {
        deliveryTokenHash: deliveryTokenHash(token),
        deliveryTokenExpiresAt: { gt: new Date() },
        status: OrderStatus.PAID,
        payoutStatus: { not: PayoutStatus.PAID },
      },
      data: {
        fulfillmentStatus: FulfillmentStatus.DISPUTED,
        disputeOpenedAt: new Date(),
        disputeReason,
        payoutStatus: PayoutStatus.ON_HOLD,
      },
    });

    if (result.count !== 1) {
      throw new Error("This order cannot be disputed or its link has expired");
    }
  }

  async getPublicOrderConfirmation(token: string) {
    if (!token) throw new Error("Invalid order confirmation link");

    const order = await prisma.order.findFirst({
      where: {
        deliveryTokenHash: deliveryTokenHash(token),
        deliveryTokenExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        status: true,
        fulfillmentStatus: true,
        payoutStatus: true,
        currency: true,
        total: true,
        deliveryConfirmedAt: true,
        items: {
          select: {
            name: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
        payments: {
          select: { status: true, paidAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) throw new Error("Order was not found or its link has expired");
    return {
      ...order,
      total: order.total.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        total: item.total.toNumber(),
      })),
    };
  }

  async requestSellerPayout(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payout: true },
    });
    if (
      !order ||
      order.status !== OrderStatus.PAID ||
      !order.deliveryConfirmedAt
    ) {
      throw new Error("Order is not eligible for payout");
    }
    if (order.disputeOpenedAt)
      throw new Error("Payout is paused while the order is disputed");
    if (order.payout?.status === PayoutStatus.PAID) {
      return { released: true, reason: "Payout already completed" };
    }
    const disputeWindowHours = Number(
      process.env.MARKETPLACE_DISPUTE_WINDOW_HOURS,
    );
    if (!Number.isFinite(disputeWindowHours) || disputeWindowHours <= 0) {
      return {
        released: false,
        reason: "A positive marketplace dispute window must be configured",
      };
    }
    const payoutEligibleAt = new Date(
      order.deliveryConfirmedAt!.getTime() +
        disputeWindowHours * 60 * 60 * 1000,
    );
    if (payoutEligibleAt > new Date()) {
      return {
        released: false,
        reason: `Seller payout becomes eligible after ${payoutEligibleAt.toISOString()}`,
      };
    }
    if (order.payout?.status === PayoutStatus.PENDING) {
      return { released: false, reason: "Transfer is being processed" };
    }

    const recipient = await prisma.user.findUnique({
      where: { id: order.userId },
      select: {
        paystackRecipientCode: true,
        paystackRecipientCurrency: true,
      },
    });
    if (
      !recipient?.paystackRecipientCode ||
      recipient.paystackRecipientCurrency !== order.currency
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { payoutStatus: PayoutStatus.ON_HOLD },
      });
      return {
        released: false,
        reason: "Seller payout destination is not configured",
      };
    }

    const payoutReference = `loci_${order.id}`;
    const payout = await prisma.orderPayout.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        merchantId: order.userId,
        amount: order.total.minus(order.platformFee),
        currency: order.currency,
        recipientCode: recipient.paystackRecipientCode,
        reference: payoutReference,
        status: PayoutStatus.QUEUED,
      },
      update: {
        amount: order.total.minus(order.platformFee),
        currency: order.currency,
        recipientCode: recipient.paystackRecipientCode,
        status: PayoutStatus.QUEUED,
        lastError: null,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { payoutStatus: PayoutStatus.QUEUED },
    });

    if (process.env.PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED !== "true") {
      return {
        released: false,
        reason: "Payout intent queued; marketplace transfers are disabled",
      };
    }

    return {
      released: false,
      reason: "Payout intent queued for the payout worker",
    };
  }

  async processQueuedPayouts(batchSize = 20) {
    if (process.env.PAYSTACK_MARKETPLACE_PAYOUTS_ENABLED !== "true") {
      return { processed: 0, disabled: true };
    }

    const disputeWindowHours = Number(
      process.env.MARKETPLACE_DISPUTE_WINDOW_HOURS,
    );
    if (!Number.isFinite(disputeWindowHours) || disputeWindowHours <= 0) {
      throw new Error(
        "A positive marketplace dispute window must be configured",
      );
    }

    const cutoff = new Date(Date.now() - disputeWindowHours * 60 * 60 * 1000);
    const stalePending = await prisma.orderPayout.findMany({
      where: {
        status: PayoutStatus.PENDING,
        requestedAt: { lte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { requestedAt: "asc" },
      take: Math.max(1, Math.min(batchSize, 100)),
    });

    for (const payout of stalePending) {
      try {
        const verified = await verifyPaystackTransfer(payout.reference);
        if (verified.status === "success") {
          await this.markTransferStatus(
            payout.reference,
            "SUCCESS",
            verified.transfer_code,
            `reconcile-${payout.reference}-success`,
            verified,
          );
        } else if (
          verified.status === "failed" ||
          verified.status === "reversed"
        ) {
          await this.markTransferStatus(
            payout.reference,
            verified.status === "failed" ? "FAILED" : "REVERSED",
            verified.transfer_code,
            `reconcile-${payout.reference}-${verified.status}`,
          );
        } else if (verified.transfer_code && !payout.transferCode) {
          await prisma.orderPayout.update({
            where: { id: payout.id },
            data: { transferCode: verified.transfer_code },
          });
        }
      } catch {
        // Unknown transfer outcomes stay pending and are not resubmitted.
      }
    }

    const queued = await prisma.orderPayout.findMany({
      where: {
        status: PayoutStatus.QUEUED,
        order: {
          status: OrderStatus.PAID,
          deliveryConfirmedAt: { lte: cutoff },
          disputeOpenedAt: null,
        },
      },
      orderBy: { createdAt: "asc" },
      take: Math.max(1, Math.min(batchSize, 100)),
    });

    let processed = 0;
    for (const payout of queued) {
      const claimed = await prisma.orderPayout.updateMany({
        where: { id: payout.id, status: PayoutStatus.QUEUED },
        data: { status: PayoutStatus.PENDING, requestedAt: new Date() },
      });
      if (claimed.count !== 1) continue;

      await prisma.order.update({
        where: { id: payout.orderId },
        data: { payoutStatus: PayoutStatus.PENDING },
      });

      try {
        const transfer = await initiatePaystackTransfer({
          amount: payout.amount.toNumber(),
          currency: payout.currency,
          recipientCode: payout.recipientCode,
          reference: payout.reference,
          reason: `Loci order ${payout.orderId}`,
        });
        await prisma.orderPayout.update({
          where: { id: payout.id },
          data: { transferCode: transfer.transfer_code, lastError: null },
        });
        processed += 1;
      } catch (error) {
        await prisma.orderPayout.update({
          where: { id: payout.id },
          data: {
            lastError:
              error instanceof Error
                ? error.message
                : "Transfer request failed",
          },
        });
      }
    }

    return { processed, disabled: false };
  }

  async markTransferStatus(
    reference: string,
    status: "SUCCESS" | "FAILED" | "REVERSED",
    transferCode?: string,
    eventKey?: string,
    verified?: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      transfer_code?: string;
    },
  ) {
    const payout = await prisma.orderPayout.findUnique({
      where: { reference },
    });
    if (!payout) return;
    if (
      status === "SUCCESS" &&
      (!verified ||
        verified.status !== "success" ||
        verified.reference !== reference ||
        verified.amount !== Math.round(payout.amount.toNumber() * 100) ||
        verified.currency !== payout.currency)
    ) {
      throw new Error("Verified transfer does not match the payout intent");
    }

    const target =
      status === "SUCCESS"
        ? PayoutStatus.PAID
        : status === "FAILED"
          ? PayoutStatus.FAILED
          : PayoutStatus.REVERSED;

    if (payout.status === target) return;
    if (payout.status === PayoutStatus.PAID && status !== "REVERSED") return;

    await prisma.$transaction(async (tx) => {
      const changed = await tx.orderPayout.updateMany({
        where: { id: payout.id, status: payout.status },
        data: {
          status: target,
          ...(transferCode ? { transferCode } : {}),
          ...(status === "SUCCESS" ? { paidAt: new Date() } : {}),
        },
      });
      if (changed.count > 0) {
        await tx.order.update({
          where: { id: payout.orderId },
          data: { payoutStatus: target },
        });
        if (status === "SUCCESS") {
          await tx.ledgerTransaction.create({
            data: {
              eventKey: `payout:${eventKey ?? reference}:success`,
              type: LedgerTransactionType.PAYOUT_SENT,
              orderId: payout.orderId,
              lines: {
                create: [
                  {
                    account: LedgerAccount.SELLER_PAYABLE,
                    side: LedgerSide.DEBIT,
                    amount: payout.amount,
                    currency: payout.currency,
                  },
                  {
                    account: LedgerAccount.PAYMENT_CLEARING,
                    side: LedgerSide.CREDIT,
                    amount: payout.amount,
                    currency: payout.currency,
                  },
                ],
              },
            },
          });
        } else if (status === "REVERSED") {
          await tx.ledgerTransaction.create({
            data: {
              eventKey: `payout:${eventKey ?? reference}:reversed`,
              type: LedgerTransactionType.PAYOUT_REVERSED,
              orderId: payout.orderId,
              lines: {
                create: [
                  {
                    account: LedgerAccount.PAYMENT_CLEARING,
                    side: LedgerSide.DEBIT,
                    amount: payout.amount,
                    currency: payout.currency,
                  },
                  {
                    account: LedgerAccount.SELLER_PAYABLE,
                    side: LedgerSide.CREDIT,
                    amount: payout.amount,
                    currency: payout.currency,
                  },
                ],
              },
            },
          });
        }
      }
    });
  }
}
