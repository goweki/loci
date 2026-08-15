import { DefaultSession, DefaultUser } from "next-auth";

import { Plan as SubscriptionPlan } from "@prisma/client";
import { SubscriptionStatus, UserRole } from "../prisma/generated";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      subscriptionStatus: SubscriptionStatus;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    subscriptionStatus: SubscriptionStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    subscriptionStatus: SubscriptionStatus;
  }
}

type AuthFlow = "signin" | "signup";
