"use server";

import { hash, generateRandom } from "@/lib/utils/passwordHandlers";

export async function generateResetToken(): Promise<{
  plain: string;
  hashed: string;
  expiry: Date;
}> {
  const plain = await generateRandom(11);
  const hashed = await hash(plain);
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return { plain, hashed, expiry };
}

export async function buildResetUrlTail(token: string, username: string) {
  return `en/reset-password/${token}/?username=${encodeURIComponent(username)}`;
}
