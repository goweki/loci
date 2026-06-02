import "server-only";

import { getServerSession, User } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth-options";

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/sign-in");

  return session.user;
}
