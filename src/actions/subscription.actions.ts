"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PlanInterval,
  PaymentMethod,
  SubscriptionStatus,
  PaymentStatus,
  PlanName,
  Prisma,
} from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { SubscriptionService } from "@/services/subscription/subscription.service";
import { ActionResult, SubscriptionStatusCheck } from "@/types";
import { revalidatePath } from "next/cache";

// Helper: Calculate standard billing interval
function getPeriodEndDate(startDate: Date, interval: PlanInterval): Date {
  const endDate = new Date(startDate);
  if (interval === "MONTHLY") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (interval === "YEARLY") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  return endDate;
}

/**
 * 1. CREATE SUBSCRIPTION (Initial Checkout Flow)
 */
export async function createSubscriptionAction({
  userId,
  planName,
  interval,
  paymentMethod,
  paymentReference,
  amount,
}: {
  userId: string;
  planName: PlanName;
  interval: PlanInterval;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  amount: number;
}): Promise<
  ActionResult<
    Prisma.SubscriptionGetPayload<{
      include: { payments: true };
    }>
  >
> {
  try {
    const plan = await prisma.plan.findUniqueOrThrow({
      where: { name: planName },
    });

    const now = new Date();
    const periodEnd = getPeriodEndDate(now, interval);

    // Create INCOMPLETE subscription along with pending payment
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        interval,
        status: SubscriptionStatus.INCOMPLETE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        payments: {
          create: {
            transactionId: paymentReference,
            paymentMethod,
            amount,
            status: PaymentStatus.PENDING,
          },
        },
      },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    revalidatePath("/en/dashboard");
    return {
      ok: true,
      data: subscription,
    };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}

/**
 * 2. ACTIVATE / RENEW SUBSCRIPTION (Hook for Webhook / Verification)
 */
export async function handlePaymentSuccess(transactionId: string) {
  try {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { transactionId },
      include: { subscription: true },
    });

    if (!payment) throw new Error("Transaction record not found");

    const now = new Date();
    const newPeriodEnd = getPeriodEndDate(now, payment.subscription.interval);

    await prisma.$transaction([
      // Mark Payment Success
      prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: now,
        },
      }),
      // Transition Subscription to ACTIVE
      prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Payment Handler Error:", error);
    return { success: false, error: "Failed to activate subscription" };
  }
}

/**
 * 3. CANCEL AT PERIOD END (User-Initiated Cancellation)
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        status: SubscriptionStatus.CANCELED,
      },
    });

    revalidatePath("/dashboard/billing");
    return { success: true, subscription };
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

/**
 * 4. GET ACTIVE USER SUBSCRIPTION WITH ACCESS CHECK
 */
export async function getUserSubscription(): Promise<
  ActionResult<SubscriptionStatusCheck>
> {
  const actor = await requireUser();
  try {
    const subscriptionCheck = await SubscriptionService.getSubscriptionByUserId(
      actor.id,
    );

    console.log(`Sub status:`, subscriptionCheck);

    return {
      ok: true,
      data: subscriptionCheck,
    };
  } catch (error) {
    console.error(`[ERROR GETTING SUBSCRIPTION]: userId-${actor.id}`, error);
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
