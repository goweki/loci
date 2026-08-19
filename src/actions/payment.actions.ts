"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SubscriptionPayment,
  SubscriptionStatus,
} from "@/lib/prisma/generated";
import { PrismaClientInitializationError } from "@/lib/prisma/generated/runtime/client";
import { PaymentWithNumberAmount } from "./payment.actions.dto";

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

export async function getPaymentsByUserId(): Promise<
  PaymentWithNumberAmount[]
> {
  const actor = await requireUser();

  const payments = await prisma.payment.findMany({
    where: {
      order: {
        userId: actor.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toNumber(),
  }));
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
  console.log(`Marking successful: ${reference}`);

  // Regular payment
  const paymentResult = await prisma.payment.updateMany({
    where: {
      transactionId: reference,
    },
    data: {
      status: PaymentStatus.SUCCESS,
    },
  });

  if (paymentResult.count > 0) {
    return true;
  }

  // Subscription payment
  const subscriptionPayment = await prisma.subscriptionPayment.findUnique({
    where: {
      transactionId: reference,
    },
    select: {
      id: true,
      subscriptionId: true,
    },
  });

  if (!subscriptionPayment) {
    console.warn(`[PAYMENT NOT FOUND]: reference=${reference}`);
    throw new Error(`Failed to mark payment as successful: ${reference}`);
  }

  // Update payment + subscription atomically
  await prisma.$transaction([
    prisma.subscriptionPayment.update({
      where: {
        id: subscriptionPayment.id,
      },
      data: {
        status: PaymentStatus.SUCCESS,
      },
    }),

    prisma.subscription.update({
      where: {
        id: subscriptionPayment.subscriptionId,
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    }),
  ]);

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
