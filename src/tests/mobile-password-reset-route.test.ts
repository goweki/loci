import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  sendResetLink: vi.fn(),
  bcryptCompare: vi.fn(),
  bcryptHash: vi.fn(),
  rateLimit: vi.fn(() => true),
  tx: {
    token: { findUnique: vi.fn(), updateMany: vi.fn() },
    user: { update: vi.fn() },
  },
  prisma: { $transaction: vi.fn() },
}));

vi.mock("@/services/user/user.service", () => ({
  UserService: {
    verifyToken: mocks.verifyToken,
    sendResetLink: mocks.sendResetLink,
  },
}));
vi.mock("@/lib/utils/authHandlers", () => ({
  bcryptCompare: mocks.bcryptCompare,
  bcryptHash: mocks.bcryptHash,
}));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { NotificationChannel } from "@/lib/prisma/generated";
import { POST } from "@/app/api/mobile/v1/auth/password-reset/route";

function request(action: string | null, body: unknown) {
  return {
    nextUrl: {
      searchParams: { get: () => action },
    },
    headers: new Headers({ "x-forwarded-for": "203.0.113.15" }),
    json: async () => body,
  } as never;
}

describe("mobile password reset endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockReturnValue(true);
    mocks.bcryptHash.mockResolvedValue("password-hash");
    mocks.bcryptCompare.mockResolvedValue(true);
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
    );
  });

  it("throttles requests before parsing or processing them", async () => {
    mocks.rateLimit.mockReturnValue(false);

    const response = await POST(request(null, { username: "owner@example.com" }));

    expect(response.status).toBe(429);
    expect(mocks.verifyToken).not.toHaveBeenCalled();
    expect(mocks.sendResetLink).not.toHaveBeenCalled();
  });

  it("returns generic success for account recovery requests", async () => {
    mocks.sendResetLink.mockRejectedValue(new Error("User not found"));

    const response = await POST(
      request(null, { username: "missing@example.com", channel: "EMAIL" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      message: expect.stringContaining("If the account exists"),
    });
  });

  it("atomically consumes an SMS token and updates the mobile password", async () => {
    mocks.verifyToken.mockResolvedValue({
      verification: true,
      tokenId: "token-9",
      verifiedChannel: NotificationChannel.SMS,
      user: { id: "user-7", name: "Owner", email: null, tel: "254700000000" },
      message: "Valid token.",
    });
    mocks.tx.token.findUnique.mockResolvedValue({
      id: "token-9",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      channel: NotificationChannel.SMS,
      hashedToken: "token-hash",
    });
    mocks.tx.token.updateMany.mockResolvedValue({ count: 1 });

    const response = await POST(
      request("complete", {
        username: "254700000000",
        token: "valid-token",
        password: "newPassword123",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.tx.token.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: "token-9",
        userId: "user-7",
        channel: NotificationChannel.SMS,
        isActive: true,
      }),
      data: { isActive: false, lastUsedAt: expect.any(Date) },
    });
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-7" },
      data: { password: "password-hash", telVerified: expect.any(Date) },
    });
  });

  it("does not change the password if the token has already been consumed", async () => {
    mocks.verifyToken.mockResolvedValue({
      verification: true,
      tokenId: "token-9",
      verifiedChannel: NotificationChannel.EMAIL,
      user: { id: "user-7", name: "Owner", email: "owner@example.com", tel: null },
      message: "Valid token.",
    });
    mocks.tx.token.findUnique.mockResolvedValue({
      id: "token-9",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      channel: NotificationChannel.EMAIL,
      hashedToken: "token-hash",
    });
    mocks.tx.token.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(
      request("complete", {
        username: "owner@example.com",
        token: "valid-token",
        password: "newPassword123",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than eight characters", async () => {
    const response = await POST(
      request("complete", {
        username: "owner@example.com",
        token: "valid-token",
        password: "short",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.verifyToken).not.toHaveBeenCalled();
  });
});
