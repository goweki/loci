"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PayoutStatus,
} from "@/lib/prisma/generated";
import { createPaystackTransferRecipient } from "@/lib/payments/paystack-api";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ActionResult } from "@/types";
import {
  MarketplacePaymentService,
  PublicOrderInput,
} from "@/services/commerce/marketplace-payment.service";

const marketplacePayments = new MarketplacePaymentService();

export async function createMarketplaceCheckoutAction(
  input: PublicOrderInput,
): Promise<ActionResult<{ orderId: string; authorizationUrl: string }>> {
  try {
    const checkout = await marketplacePayments.createCheckout(input);
    return { ok: true, data: checkout };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function confirmMarketplacePaymentAction(
  token: string,
  reference: string,
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const orderId = await marketplacePayments.confirmPublicPayment(
      token,
      reference,
    );
    revalidatePath("/");
    return { ok: true, data: { orderId } };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function getPublicOrderConfirmationAction(token: string) {
  try {
    return {
      ok: true as const,
      data: await marketplacePayments.getPublicOrderConfirmation(token),
    };
  } catch (error) {
    return { ok: false as const, error: getFriendlyErrorMessage(error) };
  }
}

export async function confirmOrderDeliveryAction(
  token: string,
): Promise<ActionResult<{ payoutMessage: string }>> {
  try {
    const orderId = await marketplacePayments.confirmDelivery(token);
    const payout = await marketplacePayments.requestSellerPayout(orderId);
    return {
      ok: true,
      data: {
        payoutMessage: payout.released
          ? "Seller payout completed"
          : payout.reason,
      },
    };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function openOrderDisputeAction(
  token: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await marketplacePayments.openBuyerDispute(token, reason);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function setSellerPaystackRecipientAction(input: {
  name: string;
  accountNumber: string;
  bankCode: string;
  type: "kepss" | "mobile_money";
  currency: Currency;
}): Promise<ActionResult<{ recipientCode: string }>> {
  const actor = await requireUser();

  try {
    const name = input.name.trim();
    const accountNumber = input.accountNumber.trim();
    const bankCode = input.bankCode.trim();

    if (!name || !accountNumber || !bankCode) {
      throw new Error("Complete all payout destination fields");
    }
    if (input.type === "mobile_money" && input.currency !== Currency.KES) {
      throw new Error("Mobile-money recipients must use KES");
    }

    const recipient = await createPaystackTransferRecipient({
      name,
      accountNumber,
      bankCode,
      type: input.type,
      currency: input.currency,
    });

    if (!recipient.active || recipient.currency !== input.currency) {
      throw new Error("Paystack did not activate the payout recipient");
    }

    await prisma.user.update({
      where: { id: actor.id },
      data: {
        paystackRecipientCode: recipient.recipient_code,
        paystackRecipientCurrency: input.currency,
      },
    });

    revalidatePath("/dashboard/settings");
    return { ok: true, data: { recipientCode: recipient.recipient_code } };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function updateMerchantFulfillmentAction(
  orderId: string,
  fulfillmentStatus: "PROCESSING" | "SHIPPED",
): Promise<ActionResult> {
  const actor = await requireUser();

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: actor.id, status: OrderStatus.PAID },
    });
    if (!order) throw new Error("Paid order not found");
    if (order.disputeOpenedAt) throw new Error("Order is on dispute hold");
    if (order.deliveryConfirmedAt)
      throw new Error("Delivery was already confirmed");

    await prisma.order.update({
      where: { id: order.id },
      data: { fulfillmentStatus },
    });

    revalidatePath("/dashboard/orders");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

export async function requestSellerPayoutAction(
  orderId: string,
): Promise<ActionResult<{ payoutMessage: string }>> {
  const actor = await requireUser();

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: actor.id },
      select: { id: true },
    });
    if (!order) throw new Error("Order not found");

    const payout = await marketplacePayments.requestSellerPayout(order.id);
    return {
      ok: true,
      data: {
        payoutMessage: payout.released
          ? "Payout already completed"
          : payout.reason,
      },
    };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}
