import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidMetaWebhookSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string,
): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const providedHex = signature.slice("sha256=".length);
  if (!/^[a-f\d]{64}$/i.test(providedHex)) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  const provided = Buffer.from(providedHex, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
