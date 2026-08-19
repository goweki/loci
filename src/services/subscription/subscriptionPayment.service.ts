import "server-only";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Currency,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SubscriptionPayment,
  SubscriptionStatus,
} from "@/lib/prisma/generated";

export type SubscriptionPaymentServiceContext = {
  userId: string;
};

export class SubscriptionPaymentService {
  private userId: string;

  private constructor({ userId }: SubscriptionPaymentServiceContext) {
    this.userId = userId;
  }

  /**
   * Factory method to initialize SubscriptionPaymentService using provided userId or session user.
   */
  static async create(userId?: string): Promise<SubscriptionPaymentService> {
    if (userId) {
      return new SubscriptionPaymentService({ userId });
    }

    const user = await requireUser();
    return new SubscriptionPaymentService({ userId: user.id });
  }

  /**
   * 🔐 Scopes payments to transactions belonging to subscriptions owned by the user
   */
  private scope<T extends Prisma.SubscriptionPaymentWhereInput>(
    where: T = {} as T,
  ): Prisma.SubscriptionPaymentWhereInput {
    return {
      ...where,
      subscription: {
        userId: this.userId,
      },
    };
  }

  /**
   * 📜 List payment transactions for the user
   */
  async getPayments(params?: { status?: PaymentStatus; limit?: number }) {
    const { status, limit = 50 } = params || {};

    return prisma.subscriptionPayment.findMany({
      where: this.scope({
        ...(status ? { status } : {}),
      }),
      include: {
        subscription: {
          include: {
            plan: {
              select: { name: true, code: true },
            },
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 🔎 Get single payment transaction by ID
   */
  async getPaymentById(paymentId: string): Promise<SubscriptionPayment> {
    const payment = await prisma.subscriptionPayment.findFirst({
      where: this.scope({ id: paymentId }),
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment transaction not found or access denied.");
    }

    return payment;
  }

  /**
   * 📝 Record a new payment attempt for a subscription
   */
  async recordPayment(params: {
    subscriptionId: string;
    transactionId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    currency?: Currency;
  }): Promise<SubscriptionPayment> {
    const {
      subscriptionId,
      transactionId,
      paymentMethod,
      amount,
      currency = "KES",
    } = params;

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: this.userId },
    });

    if (!subscription) {
      throw new Error("Target subscription not found or access denied.");
    }

    return prisma.subscriptionPayment.create({
      data: {
        subscriptionId,
        transactionId,
        paymentMethod,
        amount,
        currency,
        status: PaymentStatus.PENDING,
      },
    });
  }

  /**
   * 🔄 Process payment status updates (e.g. via payment gateway webhooks)
   */
  async updatePaymentStatus(
    transactionId: string,
    status: PaymentStatus,
    metadata?: Prisma.InputJsonValue,
  ): Promise<SubscriptionPayment> {
    const payment = await prisma.subscriptionPayment.findFirst({
      where: this.scope({ transactionId }),
      include: { subscription: true },
    });

    if (!payment) {
      throw new Error("Transaction record not found or access denied.");
    }

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status,
          paidAt:
            status === PaymentStatus.SUCCESS ? new Date() : payment.paidAt,
          ...(metadata ? { metadata } : {}),
        },
      });

      // Activate subscription when payment succeeds
      if (status === PaymentStatus.SUCCESS) {
        await tx.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: SubscriptionStatus.ACTIVE,
          },
        });
      }

      return updatedPayment;
    });
  }
}
