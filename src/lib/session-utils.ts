// lib/session-utils.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import db from "./prisma";

export async function updateUserSession(userId: string) {
  // Trigger session update with fresh user data
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (user) {
    // This will trigger the JWT callback to refresh the session
    return {
      ...user,
      subscriptionStatus: user.subscription?.status,
    };
  }
}
