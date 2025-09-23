// lib/jwt.ts
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in environment variables");
}

const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  subscriptionStatus?: string;
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function refreshToken(token: string): string | null {
  const payload = verifyJWT(token);
  if (!payload) return null;

  return signJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    subscriptionStatus: payload.subscriptionStatus,
  });
}
