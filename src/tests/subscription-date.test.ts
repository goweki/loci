import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PlanInterval } from "@/lib/prisma/generated";
import { getPeriodEndDate } from "@/lib/utils/subscription-dates";

describe("subscription billing period dates", () => {
  it("clamps month-end subscriptions to the final day of the next month", () => {
    const end = getPeriodEndDate(new Date("2026-01-31T12:00:00.000Z"), PlanInterval.MONTHLY);
    expect(end.toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });

  it("clamps leap-day annual subscriptions in non-leap years", () => {
    const end = getPeriodEndDate(new Date("2024-02-29T12:00:00.000Z"), PlanInterval.YEARLY);
    expect(end.toISOString()).toBe("2025-02-28T12:00:00.000Z");
  });
});
