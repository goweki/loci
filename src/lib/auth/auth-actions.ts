"use server";

import { getServerSession, User } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "./index";

export async function requireAuth(request?: NextRequest): Promise<User> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}
