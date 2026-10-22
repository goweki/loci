import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimitKey } from "@/lib/rate-limit";

describe("password recovery throttling", () => {
  afterEach(() => vi.useRealTimers());

  it("allows the configured attempts and rejects further attempts in the same window", () => {
    const key = `test-${crypto.randomUUID()}`;

    expect(rateLimitKey(key, 2, 60_000)).toBe(true);
    expect(rateLimitKey(key, 2, 60_000)).toBe(true);
    expect(rateLimitKey(key, 2, 60_000)).toBe(false);
  });

  it("allows attempts again after the window expires", () => {
    vi.useFakeTimers();
    const key = `test-${crypto.randomUUID()}`;

    expect(rateLimitKey(key, 1, 1_000)).toBe(true);
    expect(rateLimitKey(key, 1, 1_000)).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rateLimitKey(key, 1, 1_000)).toBe(true);
  });
});
