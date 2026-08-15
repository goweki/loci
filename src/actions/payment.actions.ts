"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@/lib/prisma/generated";

async function updatePaymentStatus(reference: string, status: PaymentStatus) {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { transactionId: reference },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: {
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });

  // update payment status
  return prisma.payment.updateMany({
    where: { transactionId: reference },
    data: { status },
  });
}

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
export async function markPaymentSuccessful(reference: string) {
  return updatePaymentStatus(reference, PaymentStatus.SUCCESS);
}

/**
 * Mark payment as failed
 */
export async function markPaymentFailed(reference: string) {
  return updatePaymentStatus(reference, PaymentStatus.FAILED);
}
