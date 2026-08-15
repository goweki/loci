import "server-only";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  PlanInterval,
  Prisma,
  Subscription,
  SubscriptionStatus,
} from "@/lib/prisma/generated";
import { SubscriptionStatusCheck } from "@/types";

export type SubscriptionServiceContext = {
  userId: string;
};

export class SubscriptionService {
  private userId: string;

  private constructor({ userId }: SubscriptionServiceContext) {
    this.userId = userId;
  }

  /**
   * Factory method to initialize SubscriptionService using provided userId or current session user.
   */
  static async create(userId?: string): Promise<SubscriptionService> {
    if (userId) {
      return new SubscriptionService({ userId });
    }

    const user = await requireUser();
    return new SubscriptionService({ userId: user.id });
  }

  /**
   * 🔐 Scopes queries strictly to the active user's subscriptions
   */
  private scope<T extends Prisma.SubscriptionWhereInput>(
    where: T = {} as T,
  ): Prisma.SubscriptionWhereInput {
    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * 💳 Get current active or latest subscription with plan and feature breakdown
   */
  async getCurrentSubscription() {
    return prisma.subscription.findFirst({
      where: this.scope({
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.INCOMPLETE],
        },
      }),
      include: {
        plan: {
          include: {
            planFeatures: {
              include: {
                feature: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Promise<SubscriptionStatusCheck>
  static async getSubscriptionByUserId(
    userId: string,
  ): Promise<SubscriptionStatusCheck> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      include: { plan: true, payments: true },
    });

    if (!subscription) {
      return { hasAccess: true, status: SubscriptionStatus.INCOMPLETE };
    }

    const now = new Date();
    const isWithinPeriod = now <= subscription.currentPeriodEnd;

    // Evaluate active status conditionally based on state & timeline
    if (subscription.status === SubscriptionStatus.ACTIVE && isWithinPeriod) {
      return { hasAccess: true, status: "ACTIVE", subscription };
    }

    if (subscription.status === SubscriptionStatus.CANCELED && isWithinPeriod) {
      return {
        hasAccess: true,
        status: SubscriptionStatus.CANCELED,
        subscription,
      };
    }

    // Mark expired if period passed
    if (!isWithinPeriod && subscription.status !== SubscriptionStatus.EXPIRED) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    }

    return { hasAccess: false, status: "EXPIRED", subscription };
  }

  /**
   * 📜 Get subscription history for the tenant
   */
  async getSubscriptionHistory() {
    return prisma.subscription.findMany({
      where: this.scope(),
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 🚀 Create or initialize a new subscription period
   */
  async subscribe(params: {
    planId: string;
    interval?: PlanInterval;
  }): Promise<Subscription> {
    const { planId, interval = PlanInterval.MONTHLY } = params;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.active) {
      throw new Error("Selected subscription plan is invalid or inactive.");
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    if (interval === PlanInterval.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return prisma.subscription.create({
      data: {
        userId: this.userId,
        planId,
        interval,
        status: SubscriptionStatus.INCOMPLETE,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
    });
  }

  /**
   * 🛑 Schedule cancellation at period end or force cancel immediately
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately = false,
  ): Promise<Subscription> {
    const sub = await prisma.subscription.findFirst({
      where: this.scope({ id: subscriptionId }),
    });

    if (!sub) {
      throw new Error("Subscription record not found or access denied.");
    }

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        ...(immediately ? { status: SubscriptionStatus.CANCELED } : {}),
      },
    });
  }

  /**
   * 🔎 Check if user has an active entitlement for a specific plan feature
   */
  async hasFeatureAccess(featureName: string): Promise<boolean> {
    const activeSub = await this.getCurrentSubscription();
    if (!activeSub) return false;

    return activeSub.plan.planFeatures.some(
      (pf) =>
        pf.feature.name.toLowerCase() === featureName.toLowerCase() &&
        pf.enabled,
    );
  }
}
