// lib/rate-limit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const key = `rate_limit:${identifier}`;
  const current = await redis.get(key);

  if (current === null) {
    await redis.setex(key, window, 1);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(Date.now() + window * 1000),
    };
  }

  const count = parseInt(current);
  if (count >= limit) {
    const ttl = await redis.ttl(key);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(Date.now() + ttl * 1000),
    };
  }

  await redis.incr(key);
  const ttl = await redis.ttl(key);

  return {
    success: true,
    limit,
    remaining: limit - count - 1,
    reset: new Date(Date.now() + ttl * 1000),
  };
}
