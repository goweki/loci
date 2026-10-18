import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";

function encryptionKey(): Buffer {
  const raw = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("WhatsApp token encryption is not configured.");

  // Automatically support hex (64 chars) or base64
  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error(
      `WHATSAPP_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length} bytes).`,
    );
  }

  return key;
}

export function encryptWhatsAppToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptWhatsAppToken(value: string): string {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Stored WhatsApp credential is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getWhatsAppTokenForPhoneNumber(phoneNumberId: string) {
  const phoneNumber = await prisma.phoneNumber.findUnique({
    where: { id: phoneNumberId },
    select: { waba: { select: { accessTokenEncrypted: true } } },
  });
  const encrypted = phoneNumber?.waba?.accessTokenEncrypted;
  if (encrypted) return decryptWhatsAppToken(encrypted);
  const fallback = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!fallback)
    throw new Error("No WhatsApp access token is available for this number.");
  return fallback;
}
