import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "./index";

export async function getAuthenticatedUser(request?: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

export async function requireAuth(request?: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return user;
}

export async function requireRole(role: string, request?: NextRequest) {
  const user = await requireAuth(request);

  if (user.role !== role) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requireSubscription(request?: NextRequest) {
  const user = await requireAuth(request);

  if (user.subscription?.status !== "ACTIVE") {
    throw new Error("Active subscription required");
  }

  return user;
}
