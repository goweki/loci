"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  SubscriptionPayment,
} from "@/lib/prisma/generated";

/**
 * Create a new payment record when transaction is initialized
 */

export async function createPaymentAction({
  reference,
  orderId,
  amount,
  method,
}: {
  reference: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
}) {
  return prisma.payment.create({
    data: {
      transactionId: reference,
      orderId,
      amount,
      paymentMethod: method,
      status: PaymentStatus.PENDING,
    },
  });
}

/**
 * List payments for a user
 */

export async function getPaymentsByUserId() {
  const actor = await requireUser();
  return prisma.payment.findMany({
    where: { order: { userId: actor.id } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Find a payment by reference
 */

export async function getPaymentByReferenceAction(reference: string) {
  return prisma.payment.findUnique({
    where: { transactionId: reference },
  });
}

/**
 * Mark payment as verified (after webhook or manual check)
 */
export async function markPaymentSuccessful(reference: string): Promise<true> {
  let payment: Payment | SubscriptionPayment | null =
    await prisma.payment.update({
      where: { transactionId: reference },
      data: { status: PaymentStatus.SUCCESS },
    });

  if (!payment) {
    payment = await prisma.subscriptionPayment.update({
      where: { transactionId: reference },
      data: { status: PaymentStatus.SUCCESS },
    });
  }

  if (!payment) {
    throw new Error("Failed to mark payment as successful");
  }

  return true;
}

/**
 * Mark payment as failed
 */
export async function markPaymentFailed(reference: string): Promise<boolean> {
  let payment: Payment | SubscriptionPayment | null =
    await prisma.payment.update({
      where: { transactionId: reference },
      data: { status: PaymentStatus.FAILED },
    });

  if (!payment) {
    payment = await prisma.subscriptionPayment.update({
      where: { transactionId: reference },
      data: { status: PaymentStatus.FAILED },
    });
  }

  if (!payment) {
    throw new Error("Failed to mark payment as failed");
  }

  return true;
}
