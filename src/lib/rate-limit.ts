// lib/rate-limit.ts
import type { NextRequest } from "next/server";

const attempts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitKey(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
) {
  const now = Date.now();
  const userAttempts = attempts.get(key) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > userAttempts.resetTime) {
    userAttempts.count = 0;
    userAttempts.resetTime = now + windowMs;
  }

  userAttempts.count++;
  attempts.set(key, userAttempts);

  if (attempts.size > 50_000) {
    for (const [storedKey, storedValue] of attempts) {
      if (storedValue.resetTime < now) attempts.delete(storedKey);
      if (attempts.size <= 40_000) break;
    }
  }

  return userAttempts.count <= maxAttempts;
}

export function rateLimit(
  request: NextRequest,
  maxAttempts: number = 5,
  windowMs: number = 1 * 60 * 1000, // 1 minute
) {
  // const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return rateLimitKey(`ip:${ip}`, maxAttempts, windowMs);
}
