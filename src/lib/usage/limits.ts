import { countMessagesThisMonthByUserId } from "@/data/message";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { NextResponse } from "next/server";

export async function checkMessageLimits(userId: string): Promise<{
  allowed: boolean;
  response?: NextResponse;
  limit?: number;
  used?: number;
}> {
  const subscriptionStatus = await getSubscriptionStatusByUserId(userId);

  let messageLimit: number = 0;

  if (!subscriptionStatus.plan) {
    if (subscriptionStatus.status === "TRIALING") {
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
    messageLimit = subscriptionStatus.plan.maxMessagesPerMonth;
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
