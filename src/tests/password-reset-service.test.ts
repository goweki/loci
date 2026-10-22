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

import { NotificationChannel } from "@/lib/prisma/generated";
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
});
