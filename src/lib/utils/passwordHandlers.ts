import "server-only";

import bcrypt from "bcryptjs";
const saltRounds = Number(process.env.BCRYPT_SALTROUNDS || 9);
import crypto from "crypto";
import { TokenType } from "../prisma/generated";

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
