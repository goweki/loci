import "server-only";

import { PlanName, SubscriptionStatus } from "@/lib/prisma/generated";

export function canMerchantSell(
  subscriptions: {
    status: SubscriptionStatus;
    plan?: { name: PlanName };
  }[],
): boolean {
  if (subscriptions.length < 1) return false;
  return subscriptions.some(
    (sub) =>
      sub.status === SubscriptionStatus.ACTIVE &&
      (sub.plan?.name === PlanName.STANDARD ||
        sub.plan?.name === PlanName.PREMIUM),
  );
}
