"use server";

import prisma from "@/lib/prisma";
import { Prisma, Plan, PlanInterval, PlanName } from "@/lib/prisma/generated";
import { SubscriptionStatusEnum } from "@/types";

interface SubscriptionStatus {
  status: SubscriptionStatusEnum;
  plan?: Plan;
  expiresAt?: Date | null; // optional — useful for UI
}

/**
 * return full sunscription status info.
 */
export async function getSubscriptionStatusByUserId(
  userId: string
): Promise<SubscriptionStatus> {
  if (!userId) throw new Error("User ID is required");

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
  });

  // Default: trialing if no subscription
  if (subscriptions.length === 0) {
    return { status: SubscriptionStatusEnum.TRIALING };
  }

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let activeSub: {
    plan: Plan;
    endDate: Date;
  } | null = null;

  for (const sub of subscriptions) {
    if (!sub.startDate) {
      break;
    }

    const startDate = new Date(sub.startDate);
    const endDate = new Date(startDate);

    if (sub.plan.interval === PlanInterval.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (sub.plan.interval === PlanInterval.YEARLY) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Add a 1-hour grace period
    const gracePeriodEnd = new Date(endDate.getTime() + 60 * 60 * 1000);

    if (gracePeriodEnd > now) {
      activeSub = { plan: sub.plan, endDate };
      break;
    }
  }
  // INACTIVE
  if (!activeSub) {
    return { status: SubscriptionStatusEnum.INACTIVE };
  }
  // DUE (expires within a week)
  if (activeSub.endDate <= oneWeekFromNow) {
    return {
      status: SubscriptionStatusEnum.DUE,
      plan: activeSub.plan,
      expiresAt: activeSub.endDate,
    };
  }
  // ACTIVE
  return {
    status: SubscriptionStatusEnum.ACTIVE,
    plan: activeSub.plan,
    expiresAt: activeSub.endDate,
  };
}

/**
 * only return status.
 */
export async function isUserSubscribed(
  userId: string
): Promise<SubscriptionStatusEnum> {
  const subStatus = await getSubscriptionStatusByUserId(userId);
  return subStatus.status;
}

/**
 * Create a new subscription for a user.
 */
export async function createSubscription(
  data: Prisma.SubscriptionUncheckedCreateInput
) {
  return prisma.subscription.create({
    data,
    include: {
      plan: true,
      payment: true,
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

/**
 * Get a subscription by its ID.
 */
export async function getSubscriptionById(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      plan: {
        include: { features: { include: { feature: true } } },
      },
      payment: true,
      user: {
        select: { id: true, email: true },
      },
    },
  });
}

/**
 * Get all subscriptions for a specific user.
 */
export async function getUserSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      payment: true,
    },
  });
}

/**
 * Cancel a subscription (sets cancelDate).
 */
export async function cancelSubscription(id: string) {
  return prisma.subscription.update({
    where: { id },
    data: { cancelDate: new Date() },
  });
}

/**
 * Update an existing subscription.
 */
export async function updateSubscription(
  id: string,
  data: Prisma.SubscriptionUpdateInput
) {
  return prisma.subscription.update({
    where: { id },
    data,
    include: {
      plan: true,
      payment: true,
    },
  });
}

/**
 * Delete a subscription permanently.
 */
export async function deleteSubscription(id: string) {
  return prisma.subscription.delete({
    where: { id },
  });
}

/**
 * Get all subscriptions for a specific plan.
 */
export async function getSubscriptionsByPlan(planId: PlanName) {
  return prisma.subscription.findMany({
    where: { planId },
    include: { user: true, payment: true },
  });
}

/**
 * Get full subscription details including plan features and payments.
 */
export async function getSubscriptionDetails(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      plan: {
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      },
      payment: true,
    },
  });
}

/**
 * Record a payment for a given subscription.
 */
export async function recordPayment(data: Prisma.PaymentUncheckedCreateInput) {
  return prisma.payment.create({
    data,
    include: {
      subscription: {
        include: { plan: true, user: true },
      },
    },
  });
}

/**
 * Get all payments for a specific subscription.
 */
export async function getPaymentsForSubscription(subscriptionId: string) {
  return prisma.payment.findMany({
    where: { subscriptionId },
    orderBy: { id: "desc" },
  });
}
