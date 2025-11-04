import bcrypt from "bcrypt";
const saltRounds = Number(process.env.BCRYPT_SALTROUNDS || 9);
import crypto from "crypto";

// To hash a password
export async function hash(plaintext: string) {
  const hash = await bcrypt.hash(plaintext, saltRounds);
  return hash;
}

// To compare input&hash
export async function compareHash(input: string, hash: string) {
  const isValid = await bcrypt.compare(input, hash);
  return isValid;
}

export async function generateRandom(length: number = 11): Promise<string> {
  const hashedToken = crypto.randomBytes(length).toString("hex");
  return hashedToken;
}
