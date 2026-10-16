import "server-only";

import prisma from "@/lib/prisma";
import { SubscriptionStatus } from "@/lib/prisma/generated";

export async function reserveWhatsAppMessage(userId: string) {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE, currentPeriodStart: { lte: now }, currentPeriodEnd: { gt: now } },
    select: { currentPeriodStart: true, currentPeriodEnd: true, plan: { select: { maxMessagesPerMonth: true } } },
    orderBy: { currentPeriodEnd: "desc" },
  });
  if (!subscription) throw new Error("An active subscription is required to send WhatsApp messages.");

  const limit = subscription.plan.maxMessagesPerMonth;
  const result = await prisma.$transaction(async (tx) => {
    await tx.messageQuota.upsert({
      where: { userId_periodStart: { userId, periodStart: subscription.currentPeriodStart } },
      create: { userId, periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd, used: 0 },
      update: { periodEnd: subscription.currentPeriodEnd },
    });
    return tx.messageQuota.updateMany({
      where: {
        userId,
        periodStart: subscription.currentPeriodStart,
        used: { lt: limit },
      },
      data: { used: { increment: 1 } },
    });
  });
  if (!result.count) throw new Error(`This account has reached its ${limit} WhatsApp message limit for the current billing period.`);
  return { userId, periodStart: subscription.currentPeriodStart, limit };
}
