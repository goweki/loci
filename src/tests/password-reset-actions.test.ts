import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => {
  const tx = {
    token: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  };

  return {
    tx,
    requireUser: vi.fn(),
    sendResetLink: vi.fn(),
    getUserByKey: vi.fn(),
    verifyToken: vi.fn(),
    bcryptHash: vi.fn(),
    bcryptCompare: vi.fn(),
    hashSha256: vi.fn((value: string) => `hash:${value}`),
    rateLimitKey: vi.fn(() => true),
    prisma: {
      $transaction: vi.fn(),
      user: { findUnique: vi.fn() },
      token: { findUnique: vi.fn(), updateMany: vi.fn() },
    },
  };
});

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/services/user/user.service", () => ({
  UserService: {
    sendResetLink: mocks.sendResetLink,
    getUserByKey: mocks.getUserByKey,
    verifyToken: mocks.verifyToken,
  },
}));
vi.mock("@/lib/utils/authHandlers", () => ({
  bcryptHash: mocks.bcryptHash,
  bcryptCompare: mocks.bcryptCompare,
  hashSha256: mocks.hashSha256,
  generateRandom: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimitKey: mocks.rateLimitKey }));
vi.mock("@/lib/utils/errorHandlers", () => ({
  getFriendlyErrorMessage: (error: Error) => error.message,
}));
vi.mock("@/lib/utils/dateHandlers", () => ({ addToDate: vi.fn() }));
vi.mock("@/lib/utils/username", () => ({
  generateUniqueUsernameFromSeed: vi.fn(),
}));
vi.mock("@/lib/sms", () => ({ default: vi.fn() }));
vi.mock("@/lib/whatsapp", () => ({ default: { sendTemplate: vi.fn() } }));

import { NotificationChannel, TokenType } from "@/lib/prisma/generated";
import {
  sendCurrentUserPasswordSetupLink,
  sendResetLinkAction,
  setNewPassword,
} from "@/actions/user.actions";

describe("password reset server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimitKey.mockReturnValue(true);
    mocks.bcryptHash.mockResolvedValue("new-password-hash");
    mocks.bcryptCompare.mockResolvedValue(true);
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
    );
  });

  it("returns the same generic recovery result when delivery fails", async () => {
    mocks.sendResetLink.mockRejectedValue(new Error("User not found"));

    await expect(
      sendResetLinkAction({
        username: "missing@example.com",
        sendTo: NotificationChannel.EMAIL,
      }),
    ).resolves.toEqual({ ok: true, data: { requested: true } });
  });

  it("uses the signed-in account email for the Settings password link", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-7", role: "USER" });
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "owner@example.com" });
    mocks.sendResetLink.mockResolvedValue({ sentTo: NotificationChannel.EMAIL });

    await expect(sendCurrentUserPasswordSetupLink("sw")).resolves.toEqual({
      ok: true,
      data: { requested: true },
    });

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-7" },
      select: { email: true },
    });
    expect(mocks.sendResetLink).toHaveBeenCalledWith({
      username: "owner@example.com",
      sendTo: NotificationChannel.EMAIL,
      language: "sw",
    });
  });

  it("does not request a Settings link when the account has no email", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-7", role: "USER" });
    mocks.prisma.user.findUnique.mockResolvedValue({ email: null });

    await expect(sendCurrentUserPasswordSetupLink("en")).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("email address"),
    });
    expect(mocks.sendResetLink).not.toHaveBeenCalled();
  });

  it("updates the password and consumes the matching token in one transaction", async () => {
    const token = "reset-token-value";
    const tokenHash = "bcrypt-token-hash";
    mocks.getUserByKey.mockResolvedValue({ id: "user-7", username: "owner" });
    mocks.verifyToken.mockResolvedValue({
      verification: true,
      tokenId: "token-9",
      verifiedChannel: NotificationChannel.EMAIL,
      message: "Valid token.",
    });
    mocks.tx.token.findUnique.mockResolvedValue({
      id: "token-9",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      channel: NotificationChannel.EMAIL,
      hashedToken: tokenHash,
    });
    mocks.tx.token.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      setNewPassword({
        username: "owner@example.com",
        token,
        password: "newPassword123",
      }),
    ).resolves.toEqual({ ok: true, data: { success: true } });

    expect(mocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.token.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: "token-9",
        hashedToken: tokenHash,
        userId: "user-7",
        type: TokenType.RESET,
        channel: NotificationChannel.EMAIL,
        isActive: true,
      }),
      data: expect.objectContaining({ isActive: false, lastUsedAt: expect.any(Date) }),
    });
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-7" },
      data: {
        password: "new-password-hash",
        emailVerified: expect.any(Date),
      },
    });
  });

  it("does not change a password when the token no longer matches", async () => {
    mocks.getUserByKey.mockResolvedValue({ id: "user-7", username: "owner" });
    mocks.verifyToken.mockResolvedValue({
      verification: true,
      tokenId: "token-9",
      verifiedChannel: NotificationChannel.EMAIL,
      message: "Valid token.",
    });
    mocks.tx.token.findUnique.mockResolvedValue({
      id: "token-9",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      channel: NotificationChannel.EMAIL,
      hashedToken: "newer-token-hash",
    });
    mocks.bcryptCompare.mockResolvedValue(false);

    await expect(
      setNewPassword({
        username: "owner@example.com",
        token: "old-token-value",
        password: "newPassword123",
      }),
    ).resolves.toMatchObject({ ok: false });

    expect(mocks.tx.token.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("does not change a password if another request already consumed the token", async () => {
    mocks.getUserByKey.mockResolvedValue({ id: "user-7", username: "owner" });
    mocks.verifyToken.mockResolvedValue({
      verification: true,
      tokenId: "token-9",
      verifiedChannel: NotificationChannel.SMS,
      message: "Valid token.",
    });
    mocks.tx.token.findUnique.mockResolvedValue({
      id: "token-9",
      isActive: true,
      expiresAt: new Date(Date.now() + 60_000),
      channel: NotificationChannel.SMS,
      hashedToken: "bcrypt-token-hash",
    });
    mocks.tx.token.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      setNewPassword({
        username: "owner@example.com",
        token: "reset-token-value",
        password: "newPassword123",
      }),
    ).resolves.toMatchObject({ ok: false });

    expect(mocks.tx.token.updateMany).toHaveBeenCalledOnce();
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("rejects passwords outside the agreed 8–16 character length", async () => {
    const result = await setNewPassword({
      username: "owner@example.com",
      token: "reset-token-value",
      password: "short",
    });

    expect(result).toMatchObject({ ok: false });
    expect(mocks.getUserByKey).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});
