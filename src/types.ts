import { Plan } from "@/lib/prisma/generated";

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
