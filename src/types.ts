import { Plan } from "@/lib/prisma/generated";

// ============================================
// shared ACTION RESULT type
// ============================================

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ============================================
// SUBSCRIPTION type
// ============================================

export enum SubscriptionStatusEnum {
  ACTIVE = "ACTIVE",
  DUE = "DUE",
  TRIALING = "TRIALING",
  INACTIVE = "INACTIVE",
}

export interface SubscriptionStatus {
  status: SubscriptionStatusEnum;
  plan?: Plan;
  expiresAt?: Date | null; // optional — useful for UI
}
