"use server";

import prisma from "@/lib/prisma";
import { PaymentStatus, PaymentMethod } from "@/lib/prisma/generated";

/**
 * Create a new payment record when transaction is initialized
 */
export async function createPayment({
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

export async function updatePaymentStatus(
  reference: string,
  status: PaymentStatus,
) {
  const payment = await prisma.payment.findFirst({
    where: { transactionId: reference },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: {
                include: { lociPlan: { include: { product: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    console.warn(`[PAYMENT] No payment found for reference: ${reference}`);
    return null;
  }

  const tx: any[] = [];

  // 1️⃣ Always update payment status
  tx.push(
    prisma.payment.updateMany({
      where: { transactionId: reference },
      data: { status },
    }),
  );

  // if subscription — activate if not started
  const lociPlan = payment.order.items.find(
    ({ product }) => !!product?.lociPlan,
  )?.product?.lociPlan;

  // 2️⃣ Subscription handling
  if (!!lociPlan && status === PaymentStatus.SUCCESS) {
    tx.push(
      prisma.subscription.upsert({
        where: {
          userId_productId: {
            userId: payment.order.userId,
            productId: "prod_456",
          },
        },
        create: {
          userId: payment.order.userId,
          productId: lociPlan.product.id,
          startDate: new Date(),
        },
        update: {
          startDate: new Date(),
        },
      }),
    );
  } else if (status === PaymentStatus.FAILED) {
    console.warn(
      `[PAYMENT] Payment ${payment.id} failed. No subscription is activated.`,
    );
  }

  return prisma.$transaction(tx);
}

/**
 * List payments for a user
 */
export async function getPaymentsByUserId(userId: string) {
  return prisma.payment.findMany({
    where: { order: { userId: userId } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Find a payment by reference
 */
export async function getPaymentByReference(reference: string) {
  return prisma.payment.findUnique({
    where: { transactionId: reference },
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
