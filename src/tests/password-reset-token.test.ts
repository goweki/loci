import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  generateRandom: vi.fn(),
  bcryptHash: vi.fn(),
}));

vi.mock("@/lib/utils/authHandlers", () => ({
  generateRandom: mocks.generateRandom,
  bcryptHash: mocks.bcryptHash,
}));

import {
  buildResetUrlTail,
  generateResetToken,
} from "@/lib/utils/resetToken";

describe("password reset tokens", () => {
  afterEach(() => vi.useRealTimers());

  it("uses 32 random bytes, stores only the hash, and expires after one hour", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T10:00:00.000Z"));
    mocks.generateRandom.mockReturnValue("random-token");
    mocks.bcryptHash.mockResolvedValue("bcrypt-hash");

    await expect(generateResetToken()).resolves.toEqual({
      plain: "random-token",
      hashed: "bcrypt-hash",
      expiry: new Date("2026-10-22T11:00:00.000Z"),
    });
    expect(mocks.generateRandom).toHaveBeenCalledWith(32);
    expect(mocks.bcryptHash).toHaveBeenCalledWith("random-token");
  });

  it("keeps the selected locale in the reset route and encodes the account identifier", async () => {
    await expect(
      buildResetUrlTail("token-1", "owner+test@example.com", "sw"),
    ).resolves.toBe(
      "sw/reset-password/token-1?username=owner%2Btest%40example.com",
    );
  });

  it("falls back to English for an unsupported locale", async () => {
    await expect(
      buildResetUrlTail("token-1", "owner@example.com", "fr" as never),
    ).resolves.toBe("en/reset-password/token-1?username=owner%40example.com");
  });
});
