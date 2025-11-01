import db from "@/lib/prisma";
import { Plan, PlanInterval } from "@prisma/client";

export enum Status {
  ACTIVE = "ACTIVE",
  DUE = "DUE",
  TRIALING = "TRIALING",
  INACTIVE = "INACTIVE",
}

interface SubscriptionStatus {
  status: Status;
  plan?: Plan;
  expiresAt?: Date | null; // optional — useful for UI
}

export async function getSubscriptionStatusByUserId(
  userId: string
): Promise<SubscriptionStatus> {
  if (!userId) throw new Error("User ID is required");

  const subscriptions = await db.subscription.findMany({
    where: { userId },
    include: { plan: true },
  });

  // Default: trialing if no subscription
  if (subscriptions.length === 0) {
    return { status: Status.TRIALING };
  }

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let activeSub: {
    plan: Plan;
    endDate: Date;
  } | null = null;

  for (const sub of subscriptions) {
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
    return { status: Status.INACTIVE };
  }
  // DUE (expires within a week)
  if (activeSub.endDate <= oneWeekFromNow) {
    return {
      status: Status.DUE,
      plan: activeSub.plan,
      expiresAt: activeSub.endDate,
    };
  }
  // ACTIVE
  return {
    status: Status.ACTIVE,
    plan: activeSub.plan,
    expiresAt: activeSub.endDate,
  };
}
