import { countMessagesSentByUserId } from "@/actions/message.actions";
import { SubscriptionService } from "@/services/subscription/subscription.service";
import { NextResponse } from "next/server";
import { PlanInterval, SubscriptionStatus } from "../prisma/generated";
import prisma from "../prisma";

/**
 * Calculates the current 30-day/monthly cycle window for a subscription.
 * Handles both MONTHLY and YEARLY subscription intervals.
 */
export function getCurrentCycleBounds(
  periodStart: Date,
  interval: PlanInterval,
  now = new Date(),
): { cycleStart: Date; cycleEnd: Date } {
  if (interval === PlanInterval.MONTHLY) {
    return {
      cycleStart: periodStart,
      cycleEnd: new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000), // or exact billing end date
    };
  }

  // Handle YEARLY subscription: calculate current monthly iteration
  const start = new Date(periodStart);
  let cycleStart = new Date(start);

  while (true) {
    const nextMonth = new Date(cycleStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (now >= cycleStart && now < nextMonth) {
      return {
        cycleStart,
        cycleEnd: nextMonth,
      };
    }

    cycleStart = nextMonth;

    // Safety guard to prevent infinite loop past subscription end
    if (cycleStart > now) {
      return {
        cycleStart,
        cycleEnd: nextMonth,
      };
    }
  }
}

export type MessageLimitResponse = {
  allowed: boolean;
  response?: NextResponse;
  limit?: number;
  used?: number;
};

export async function checkMessageLimits(
  userId: string,
): Promise<MessageLimitResponse> {
  const subscriptionStatus =
    await SubscriptionService.getSubscriptionByUserId(userId);

  let messageLimit: number = 0;
  let sentMessages: number = 0;
  const subscription = subscriptionStatus.subscription;

  if (!subscription) {
    if (subscriptionStatus.status === SubscriptionStatus.INCOMPLETE) {
      messageLimit = 10;
      sentMessages = await countMessagesSentByUserId(userId);
    } else {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "No active subscription found" },
          { status: 402 },
        ),
      };
    }
  } else {
    messageLimit = subscription.plan.maxMessagesPerMonth;

    // messages sent this cycle
    const { cycleStart, cycleEnd } = getCurrentCycleBounds(
      subscription.currentPeriodStart,
      subscription.interval,
    );

    sentMessages = await prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: cycleStart,
          lt: cycleEnd,
        },
      },
    });
  }

  if (sentMessages >= messageLimit) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Message limit exceeded for your current plan.",
          limit: messageLimit,
          used: sentMessages,
        },
        { status: 403 },
      ),
    };
  }

  return { allowed: true, limit: messageLimit, used: sentMessages };
}
