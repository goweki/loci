"use server";

import { bcryptHash, generateRandom } from "@/lib/utils/authHandlers";
import type { Language } from "@/lib/i18n/i18n-settings";
import { isValidLanguage } from "@/lib/i18n/i18n-helpers";

export async function generateResetToken(): Promise<{
  plain: string;
  hashed: string;
  expiry: Date;
}> {
  const plain = await generateRandom(32);
  const hashed = await bcryptHash(plain);
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return { plain, hashed, expiry };
}

export async function buildResetUrlTail(
  token: string,
  username: string,
  language: Language = "en",
) {
  const safeLanguage = isValidLanguage(language) ? language : "en";
  return `${safeLanguage}/reset-password/${token}?username=${encodeURIComponent(username)}`;
}
