"use server";

import prisma from "@/lib/prisma";
import { PaymentStatus, PaymentMethod } from "@/lib/prisma/generated";

/**
 * Create a new payment record when transaction is initialized
 */
export async function createPayment({
  reference,
  subscriptionId,
  amount,
  method = PaymentMethod.ONLINE,
}: {
  reference: string;
  subscriptionId: string;
  amount: number;
  method?: PaymentMethod;
}) {
  return prisma.payment.create({
    data: {
      reference,
      subscriptionId,
      amount,
      paymentMethod: method,
      status: PaymentStatus.PENDING,
    },
  });
}

export async function updatePaymentStatus(
  reference: string,
  status: PaymentStatus,
) {
  const payment = await prisma.payment.findFirst({
    where: { reference },
    include: { subscription: true },
  });

  if (!payment) {
    console.warn(`[PAYMENT] No payment found for reference: ${reference}`);
    return null;
  }

  const tx: any[] = [];

  // 1️⃣ Always update payment status
  tx.push(
    prisma.payment.updateMany({
      where: { reference },
      data: { status },
    }),
  );

  // 2️⃣ Subscription handling
  if (status === PaymentStatus.SUCCESS) {
    // Existing subscription — activate if not started
    if (!payment.subscription.startDate) {
      tx.push(
        prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            startDate: new Date(),
          },
        }),
      );
    }
  } else if (status === PaymentStatus.FAILED) {
    console.warn(
      `[PAYMENT] Payment ${payment.id} failed. No subscription will be activated.`,
    );

    if (payment.subscription) {
      tx.push(
        prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            startDate: null,
          },
        }),
      );
    }
  }

  return prisma.$transaction(tx);
}

/**
 * List payments for a user
 */
export async function getPaymentsByUserId(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (subscriptions.length === 0) return [];

  const subscriptionIds = subscriptions.map(({ id }) => id);

  return prisma.payment.findMany({
    where: { subscriptionId: { in: subscriptionIds } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Find a payment by reference
 */
export async function getPaymentByReference(reference: string) {
  return prisma.payment.findUnique({
    where: { reference },
  });
}

/**
 * List payments for a specific subscription
 */
export async function getPaymentsBySubscription(subscriptionId: string) {
  return prisma.payment.findMany({
    where: { subscriptionId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Mark payment as verified (after webhook or manual check)
 */
export async function markPaymentSuccessful(reference: string) {
  return updatePaymentStatus(reference, PaymentStatus.SUCCESS);
}

/**
 * Mark payment as failed
 */
export async function markPaymentFailed(reference: string) {
  return updatePaymentStatus(reference, PaymentStatus.FAILED);
}
