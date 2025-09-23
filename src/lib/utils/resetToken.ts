import { hash, generateRandom } from "@/lib/utils/passwordHandlers";

export async function generateResetToken() {
  const plain = await generateRandom(11);
  const hashed = await hash(plain);
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return { plain, hashed, expiry };
}

// utils/url.ts
export function buildResetURL(baseUrl: string, token: string, email: string) {
  return `${baseUrl}/reset-password/${token}/?email_=${encodeURIComponent(
    email
  )}`;
}
