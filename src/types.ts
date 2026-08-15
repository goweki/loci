import { Prisma, SubscriptionStatus } from "@/lib/prisma/generated";

// ============================================
// shared ACTION RESULT type
// ============================================

export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string };

// ============================================
// SUBSCRIPTION type
// ============================================

export interface SubscriptionStatusCheck {
  hasAccess: boolean;
  status: SubscriptionStatus;
  subscription?: Prisma.SubscriptionGetPayload<{
    include: {
      plan: true;
      payments: true; // Note: Use SubscriptionPayment if using the separated model
    };
  }>;
}
