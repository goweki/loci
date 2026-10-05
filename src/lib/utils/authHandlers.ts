import "server-only";

import bcrypt from "bcryptjs";
const saltRounds = Number(process.env.BCRYPT_SALTROUNDS || 9);
import crypto from "crypto";
import { TokenType } from "../prisma/generated";
const hmacSecret = process.env.HMAC_SECRET;

// hash a password
export async function bcryptHash(plaintext: string) {
  const hash = await bcrypt.hash(plaintext, saltRounds);
  return hash;
}

// compare input to password
export async function bcryptCompare(
  input: string,
  hash: string,
): Promise<boolean> {
  const isValid = await bcrypt.compare(input, hash);
  return isValid;
}

export function generateRandom(length: number = 11): string {
  const random = crypto.randomBytes(length).toString("hex");
  return random;
}

export function generateRawToken(type: TokenType): string {
  return `loc_${type.toLowerCase()}_${generateRandom()}`;
}

export function hashSha256(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ========================
// ==== HMAC signature ====
// ========================

export function generateHmacSignature(
  method: string,
  url: string,
  timestamp: string,
  nonce: string,
  body: string,
): string {
  if (!hmacSecret) {
    throw new Error("Missing env LOCI_HMAC_SECRET");
  }

  const payload = [method.toUpperCase(), url, timestamp, nonce, body].join(".");

  return crypto
    .createHmac("sha256", hmacSecret)
    .update(payload, "utf8")
    .digest("hex");
}
