import "server-only";

import { Subscription, SubscriptionStatus } from "@/lib/prisma/generated";

export function canMerchantSell(
  subscriptions: { status: SubscriptionStatus }[],
): boolean {
  if (subscriptions.length < 1) return false;
  return subscriptions.some((sub) => sub.status === SubscriptionStatus.ACTIVE);
}
