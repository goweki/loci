import { DefaultSession, DefaultUser } from "next-auth";

import { Plan as SubscriptionPlan } from "@prisma/client";
import { Status as SubscriptionStatus } from "@/data/subscription";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      subscriptionStatus: SubscriptionStatus;
      subscriptionPlan: SubscriptionPlan | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    name?: string | null;
    image?: string | null;
    role: string;
    subscriptionStatus: SubscriptionStatus;
    subscriptionPlan?: SubscriptionPlan | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    role?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionPlan?: SubscriptionPlan | null;
  }
}
