"use server";

import prisma from "@/lib/prisma";
import { Prisma, Plan, PlanInterval, PlanName } from "@/lib/prisma/generated";
import { subscriptionInclude } from "@/services/user/user.dto";
import { SubscriptionStatus, SubscriptionStatusEnum } from "@/types";

/**
 * return full sunscription status info.
 */
export async function getSubscriptionStatusByUserId(
  userId: string,
): Promise<SubscriptionStatus> {
  if (!userId) throw new Error("User ID is required");

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, product: { lociPlan: { isNot: null } } },
    include: subscriptionInclude,
  });

  const plans = subscriptions.map(({ product }) => product.lociPlan);

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
    if (!sub.startDate || !sub.product.lociPlan) {
      break;
    }

    const startDate = new Date(sub.startDate);
    const endDate = new Date(startDate);

    if (sub.product.lociPlan?.interval === PlanInterval.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (sub.product.lociPlan?.interval === PlanInterval.YEARLY) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Add a 1-hour grace period
    const gracePeriodEnd = new Date(endDate.getTime() + 60 * 60 * 1000);

    if (gracePeriodEnd > now) {
      activeSub = { plan: sub.product.lociPlan, endDate };
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
  userId: string,
): Promise<SubscriptionStatusEnum> {
  const subStatus = await getSubscriptionStatusByUserId(userId);
  return subStatus.status;
}

/**
 * Create a new subscription for a user.
 */
export async function createLociSubscription(userId: string, plan: PlanName) {
  const plan_ = await prisma.plan.findUnique({
    where: { name: plan },
    include: { product: true },
  });

  if (!plan_) {
    throw new Error("Plan product not found. Subscription not created");
  }

  return prisma.subscription.create({
    data: { userId, productId: plan_.product.id },
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
    include: subscriptionInclude,
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
  data: Prisma.SubscriptionUpdateInput,
) {
  return prisma.subscription.update({
    where: { id },
    data,
    include: subscriptionInclude,
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
export async function getSubscriptionsByPlan(planName: PlanName) {
  return prisma.subscription.findMany({
    where: { product: { lociPlan: { name: planName } } },
    include: { product: { include: { lociPlan: true } } },
  });
}

/**
 * Get full subscription details including plan features and payments.
 */
export async function getSubscriptionDetails(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          lociPlan: {
            include: {
              features: {
                include: {
                  feature: true,
                },
              },
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
      order: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get all payments for a specific subscription.
 */
export async function getPaymentsForSubscription(subscriptionId: string) {
  return prisma.payment.findMany({
    where: {
      order: {
        items: {
          some: {
            product: {
              subscriptions: {
                some: {
                  id: subscriptionId,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Recommended over 'id' for logical time sorting
    },
  });
}
