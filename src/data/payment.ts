import prisma from "@/lib/prisma";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

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

/**
 * Update the payment status (used by webhook)
 */
export async function updatePaymentStatus(
  reference: string,
  status: PaymentStatus
) {
  return prisma.payment.updateMany({
    where: { reference },
    data: { status },
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
 * List all payments for a specific subscription
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
