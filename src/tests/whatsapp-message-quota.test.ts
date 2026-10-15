import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscription: vi.fn(),
  quotaUpsert: vi.fn(),
  quotaUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  default: {
    subscription: { findFirst: mocks.subscription },
    $transaction: mocks.transaction,
  },
}));

import { reserveWhatsAppMessage } from "@/services/whatsapp/message-quota.service";

describe("WhatsApp message quota reservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscription.mockResolvedValue({
      currentPeriodStart: new Date("2026-10-01T00:00:00Z"),
      currentPeriodEnd: new Date("2026-11-01T00:00:00Z"),
      plan: { maxMessagesPerMonth: 100 },
    });
    mocks.quotaUpsert.mockResolvedValue({});
    mocks.quotaUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation((run: (tx: unknown) => unknown) => run({
      messageQuota: { upsert: mocks.quotaUpsert, updateMany: mocks.quotaUpdateMany },
    }));
  });

  it("atomically reserves within the subscription billing period and plan limit", async () => {
    await reserveWhatsAppMessage("owner-1");
    expect(mocks.quotaUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_periodStart: { userId: "owner-1", periodStart: new Date("2026-10-01T00:00:00Z") } },
    }));
    expect(mocks.quotaUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "owner-1", used: { lt: 100 } }),
      data: { used: { increment: 1 } },
    }));
  });

  it("rejects once the atomic counter reaches the plan limit", async () => {
    mocks.quotaUpdateMany.mockResolvedValue({ count: 0 });
    await expect(reserveWhatsAppMessage("owner-1")).rejects.toThrow("reached its 100 WhatsApp message limit");
  });
});
