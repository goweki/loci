// lib/rate-limit.ts
import { NextRequest } from "next/server";

const attempts = new Map();

export function rateLimit(
  request: NextRequest,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const userAttempts = attempts.get(ip) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > userAttempts.resetTime) {
    userAttempts.count = 0;
    userAttempts.resetTime = now + windowMs;
  }

  userAttempts.count++;
  attempts.set(ip, userAttempts);

  return userAttempts.count <= maxAttempts;
}
