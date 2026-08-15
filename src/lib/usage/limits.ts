import { countMessagesThisMonthByUserId } from "@/actions/message.actions";
import { getUserSubscription } from "@/actions/subscription.actions";
import { SubscriptionService } from "@/services/subscription/subscription.service";
import { NextResponse } from "next/server";
import { SubscriptionStatus } from "../prisma/generated";

export async function checkMessageLimits(userId: string): Promise<{
  allowed: boolean;
  response?: NextResponse;
  limit?: number;
  used?: number;
}> {
  const subscriptionStatus =
    await SubscriptionService.getSubscriptionByUserId(userId);

  let messageLimit: number = 0;

  if (!subscriptionStatus.subscription) {
    if (subscriptionStatus.status === SubscriptionStatus.INCOMPLETE) {
      messageLimit = 10;
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
    messageLimit = subscriptionStatus.subscription.plan.maxMessagesPerMonth;
  }

  const sentMessages = await countMessagesThisMonthByUserId(userId);

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
