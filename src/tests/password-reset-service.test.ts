import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  prisma: {
    user: { findFirst: vi.fn() },
    token: { upsert: vi.fn() },
  },
  sendMail: vi.fn(),
  resetPasswordEmail: vi.fn(),
  welcomeEmail: vi.fn(),
  buildResetUrlTail: vi.fn(),
  generateResetToken: vi.fn(),
  bcryptCompare: vi.fn(),
  sendSms: vi.fn(),
  requireUser: vi.fn(),
  sendTemplate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/mail", () => ({ sendMail: mocks.sendMail }));
vi.mock("@/lib/mail/email-render", () => ({
  resetPasswordEmail: mocks.resetPasswordEmail,
  welcomeEmail: mocks.welcomeEmail,
}));
vi.mock("@/lib/sms", () => ({ default: mocks.sendSms }));
vi.mock("@/lib/whatsapp", () => ({ default: { sendTemplate: mocks.sendTemplate } }));
vi.mock("@/lib/utils/getUrl", () => ({
  BASE_URL: "https://loci.example",
  BANNER_IMAGE_URL: "https://loci.example/banner.png",
}));
vi.mock("@/lib/utils/authHandlers", () => ({
  bcryptCompare: mocks.bcryptCompare,
}));
vi.mock("@/lib/utils/resetToken", () => ({
  buildResetUrlTail: mocks.buildResetUrlTail,
  generateResetToken: mocks.generateResetToken,
}));

import { NotificationChannel, TokenType } from "@/lib/prisma/generated";
import { UserService } from "@/services/user/user.service";

describe("password reset service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      name: "Account Owner",
      username: "owner",
      email: "owner@example.com",
      tel: "254700000000",
    });
    mocks.generateResetToken.mockResolvedValue({
      plain: "plaintext-reset-token",
      hashed: "stored-token-hash",
      expiry: new Date("2026-10-22T11:00:00.000Z"),
    });
    mocks.buildResetUrlTail.mockResolvedValue(
      "sw/reset-password/plaintext-reset-token?username=owner%40example.com",
    );
    mocks.resetPasswordEmail.mockResolvedValue({ html: "html", text: "text" });
    mocks.sendMail.mockResolvedValue({ error: null });
  });

  it("stores the email verification channel and creates a language-aware link", async () => {
    const result = await UserService.sendResetLink({
      username: "owner@example.com",
      sendTo: NotificationChannel.EMAIL,
      language: "sw",
    });

    expect(result.sentTo).toBe(NotificationChannel.EMAIL);
    expect(mocks.prisma.token.upsert).toHaveBeenCalledWith({
      where: {
        type_userId: { userId: "user-7", type: "RESET" },
      },
      update: expect.objectContaining({
        hashedToken: "stored-token-hash",
        channel: NotificationChannel.EMAIL,
        isActive: true,
      }),
      create: expect.objectContaining({
        userId: "user-7",
        type: "RESET",
        hashedToken: "stored-token-hash",
        channel: NotificationChannel.EMAIL,
      }),
    });
    expect(mocks.buildResetUrlTail).toHaveBeenCalledWith(
      "plaintext-reset-token",
      "owner@example.com",
      "sw",
    );
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        html: "html",
        text: "text",
      }),
    );
  });

  it("records the requested phone channel for SMS reset links", async () => {
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      name: "Account Owner",
      username: "owner",
      email: null,
      tel: "254700000000",
    });
    mocks.sendSms.mockResolvedValue(undefined);

    await UserService.sendResetLink({
      username: "254700000000",
      sendTo: NotificationChannel.SMS,
    });

    expect(mocks.prisma.token.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ channel: NotificationChannel.SMS }),
        create: expect.objectContaining({ channel: NotificationChannel.SMS }),
      }),
    );
    expect(mocks.sendSms).toHaveBeenCalledOnce();
  });

  it("records the WhatsApp channel and sends its template link", async () => {
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      name: "Account Owner",
      username: "owner",
      email: null,
      tel: "254700000000",
    });

    const result = await UserService.sendResetLink({
      username: "254700000000",
      sendTo: NotificationChannel.WHATSAPP,
    });

    expect(result.sentTo).toBe(NotificationChannel.WHATSAPP);
    expect(mocks.prisma.token.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ channel: NotificationChannel.WHATSAPP }),
        create: expect.objectContaining({ channel: NotificationChannel.WHATSAPP }),
      }),
    );
    expect(mocks.sendTemplate).toHaveBeenCalledOnce();
  });

  it("returns only safe account fields after a valid token check", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      name: "Account Owner",
      email: "owner@example.com",
      tel: "254700000000",
      password: "password-hash-must-not-leak",
      tokens: [
        {
          id: "token-9",
          type: "RESET",
          isActive: true,
          expiresAt,
          hashedToken: "secret-token-hash-must-not-leak",
          channel: NotificationChannel.EMAIL,
        },
      ],
    });
    mocks.bcryptCompare.mockResolvedValue(true);

    await expect(
      UserService.verifyToken({
        username: "owner@example.com",
        token: "presented-token",
        type: TokenType.RESET,
      }),
    ).resolves.toEqual({
      verification: true,
      tokenId: "token-9",
      user: {
        id: "user-7",
        name: "Account Owner",
        email: "owner@example.com",
        tel: "254700000000",
      },
      message: "Valid token.",
      verifiedChannel: NotificationChannel.EMAIL,
    });
    expect(mocks.bcryptCompare).toHaveBeenCalledWith(
      "presented-token",
      "secret-token-hash-must-not-leak",
    );
  });

  it("rejects an invalid reset token", async () => {
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      tokens: [
        {
          id: "token-9",
          type: "RESET",
          isActive: true,
          expiresAt: new Date(Date.now() + 60_000),
          hashedToken: "stored-hash",
          channel: NotificationChannel.EMAIL,
        },
      ],
    });
    mocks.bcryptCompare.mockResolvedValue(false);

    await expect(
      UserService.verifyToken({
        username: "owner@example.com",
        token: "wrong-token",
        type: TokenType.RESET,
      }),
    ).resolves.toMatchObject({ verification: false, message: "Invalid token." });
  });

  it("rejects an expired reset token without comparing the token", async () => {
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      tokens: [
        {
          id: "token-9",
          type: "RESET",
          isActive: true,
          expiresAt: new Date(Date.now() - 1_000),
          hashedToken: "stored-hash",
          channel: NotificationChannel.EMAIL,
        },
      ],
    });
    mocks.bcryptCompare.mockResolvedValue(true);

    await expect(
      UserService.verifyToken({
        username: "owner@example.com",
        token: "expired-token",
        type: TokenType.RESET,
      }),
    ).resolves.toMatchObject({ verification: false, message: "Expired token." });
    expect(mocks.bcryptCompare).not.toHaveBeenCalled();
  });

  it("rejects inactive reset tokens", async () => {
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-7",
      tokens: [
        {
          id: "token-9",
          type: "RESET",
          isActive: false,
          expiresAt: new Date(Date.now() + 60_000),
          hashedToken: "stored-hash",
          channel: NotificationChannel.EMAIL,
        },
      ],
    });

    await expect(
      UserService.verifyToken({
        username: "owner@example.com",
        token: "inactive-token",
        type: TokenType.RESET,
      }),
    ).resolves.toMatchObject({
      verification: false,
      message: "Invalid link or token expired.",
    });
    expect(mocks.bcryptCompare).not.toHaveBeenCalled();
  });
});
