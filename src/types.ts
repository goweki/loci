import { Prisma, SubscriptionStatus } from "@/lib/prisma/generated";

// ============================================
// shared ACTION RESULT type
// ============================================

export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string };

// ============================================
// SUBSCRIPTION type
// ============================================

type SubscriptionWithNumberPaymentAmounts = Omit<
  Prisma.SubscriptionGetPayload<{
    include: {
      plan: true;
      payments: true;
    };
  }>,
  "payments"
> & {
  payments: Array<
    Omit<
      Prisma.SubscriptionGetPayload<{
        include: {
          plan: true;
          payments: true;
        };
      }>["payments"][number],
      "amount"
    > & { amount: number }
  >;
};

export interface SubscriptionStatusCheck {
  hasAccess: boolean;
  status: SubscriptionStatus;
  subscription?: SubscriptionWithNumberPaymentAmounts;
}
