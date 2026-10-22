"use server";

import prisma from "@/lib/prisma";
import {
  MessageType,
  NotificationChannel,
  Prisma,
  TokenType,
  UserRole,
} from "@/lib/prisma/generated";
import sendSms, { ATRecipient } from "@/lib/sms";
import { addToDate } from "@/lib/utils/dateHandlers";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import {
  bcryptCompare,
  bcryptHash,
  generateRandom,
  hashSha256,
} from "@/lib/utils/authHandlers";
import { generateUniqueUsernameFromSeed } from "@/lib/utils/username";
import whatsapp from "@/lib/whatsapp";
import { UserService } from "@/services/user/user.service";
import type { ActionResult } from "@/types";
import { SendOtpProps } from "./user.actions.dto";
import { requireUser } from "@/lib/auth";
import type { Language } from "@/lib/i18n/i18n-settings";
import { setPasswordSchema } from "@/lib/validations";
import { rateLimitKey } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import z from "zod";

// ======================================================
// USER ACTIONS
// ======================================================

export async function getAdminUserAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof UserService.getAdminUser>>>
> {
  try {
    const user = await UserService.getAdminUser();

    return {
      ok: true,
      data: user,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserByIdAction<
  T extends Prisma.UserInclude | undefined = undefined,
>(
  userId: string,
  include?: T,
): Promise<
  ActionResult<
    Prisma.UserGetPayload<T extends Prisma.UserInclude ? { include: T } : {}>
  >
> {
  try {
    const service = await UserService.create();

    const user = await service.getUserById(userId, include);

    return {
      ok: true,
      data: user,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserByKeyAction<
  T extends Prisma.UserInclude | undefined = undefined,
>(
  key: string,
  include?: T,
): Promise<
  ActionResult<
    Prisma.UserGetPayload<T extends Prisma.UserInclude ? { include: T } : {}>
  >
> {
  try {
    const user = await UserService.getUserByKey(key, include);

    return {
      ok: true,
      data: user,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUsersAction(params?: {
  search?: string;
  limit?: number;
  cursor?: string;
  role?: UserRole;
}): Promise<ActionResult<Awaited<ReturnType<UserService["getUsers"]>>>> {
  try {
    const service = await UserService.create();

    const users = await service.getUsers(params);

    return {
      ok: true,
      data: users,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserStatsAction(): Promise<
  ActionResult<Awaited<ReturnType<UserService["getUserStats"]>>>
> {
  try {
    const service = await UserService.create();

    const stats = await service.getUserStats();

    return {
      ok: true,
      data: stats,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// PASSWORD RESET ACTIONS
// ======================================================

export async function sendResetLinkAction(params: {
  username: string;
  sendTo?: NotificationChannel;
  language?: Language;
}): Promise<
  ActionResult<{ requested: true }>
> {
  const requestedUsername =
    typeof params?.username === "string" ? params.username : "";
  const key = hashSha256(
    `password-reset:${requestedUsername.trim().toLowerCase()}`,
  );
  if (!rateLimitKey(key, 5, 15 * 60 * 1000)) {
    return { ok: true, data: { requested: true } };
  }

  try {
    await UserService.sendResetLink(params);

    return {
      ok: true,
      data: { requested: true },
    };
  } catch {
    // Public recovery requests must not reveal whether an account exists or
    // whether delivery succeeded. The same confirmation is shown in either case.
    return {
      ok: true,
      data: { requested: true },
    };
  }
}

export async function sendCurrentUserPasswordSetupLink(
  language: Language,
): Promise<ActionResult<{ requested: true }>> {
  try {
    const user = await requireUser();
    if (!rateLimitKey(`password-setup:${user.id}`, 3, 15 * 60 * 1000)) {
      return {
        ok: false,
        error: "Please wait before requesting another password link.",
      };
    }
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!dbUser?.email) {
      return { ok: false, error: "Add an email address to your account first." };
    }

    await UserService.sendResetLink({
      username: dbUser.email,
      sendTo: NotificationChannel.EMAIL,
      language,
    });

    return { ok: true, data: { requested: true } };
  } catch (error) {
    console.error("Authenticated password setup request failed", error);
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function requestCurrentUserAccountDeletion(
  confirmedEmail: string,
): Promise<ActionResult<{ requested: true }>> {
  const emailValidation = z
    .email()
    .safeParse(typeof confirmedEmail === "string" ? confirmedEmail.trim() : "");
  if (!emailValidation.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const user = await requireUser();
  try {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, tel: true },
    });
    if (!account?.email) {
      return {
        ok: false,
        error: "Your account does not have an email address to verify.",
      };
    }

    if (
      emailValidation.data.trim().toLowerCase() !==
      account.email.trim().toLowerCase()
    ) {
      return {
        ok: false,
        error: "The email address does not match your account.",
      };
    }

    if (!rateLimitKey(`account-deletion:${user.id}`, 3, 60 * 60 * 1000)) {
      return {
        ok: false,
        error: "Please wait before submitting another deletion request.",
      };
    }

    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return entities[character];
      });
    const phone = account.tel || "Not provided";
    const subject = "Loci account deletion request";
    const text = [
      "A user has requested deletion of their Loci account.",
      "",
      `Account ID: ${account.id}`,
      `Account email: ${account.email}`,
      `Account phone: ${phone}`,
    ].join("\n");

    const result = await sendMail({
      to: "loci@goweki.com",
      subject,
      text,
      html: `<p>A user has requested deletion of their Loci account.</p>
        <p>Account ID: ${escapeHtml(account.id)}<br>
        Account email: ${escapeHtml(account.email)}<br>
        Account phone: ${escapeHtml(phone)}</p>`,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }

    return { ok: true, data: { requested: true } };
  } catch (error) {
    console.error("Failed to send account deletion request", error);
    return {
      ok: false,
      error:
        "Could not send your account deletion request. Please try again later.",
    };
  }
}

export async function verifyResetTokenAction(params: {
  username: string;
  token: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof UserService.verifyToken>>>> {
  const username = typeof params?.username === "string" ? params.username : "";
  if (
    !rateLimitKey(
      hashSha256(`reset-verify:${username.trim().toLowerCase()}`),
      10,
      15 * 60 * 1000,
    )
  ) {
    return {
      ok: false,
      error: "Too many attempts. Please request a new link later.",
    };
  }

  try {
    const result = await UserService.verifyToken({
      username: params.username,
      token: params.token,
      type: TokenType.RESET,
    });

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// GENERIC TOKEN VERIFICATION
// ======================================================

export async function verifyTokenAction(params: {
  username: string;
  token: string;
  type: TokenType;
}): Promise<ActionResult<Awaited<ReturnType<typeof UserService.verifyToken>>>> {
  try {
    const result = await UserService.verifyToken(params);

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// SIGN UP
// ======================================================

interface SignUpProps {
  name: string;
  email?: string;
  tel?: string;
  verificationMethod: NotificationChannel;
}

export async function signUpUser(props: SignUpProps): Promise<
  ActionResult<{
    message: string;
    verificationMethod: NotificationChannel;
  }>
> {
  try {
    const userDto = {
      ...props,
      username: await generateUniqueUsernameFromSeed(props.name),
    };

    const newUser = await prisma.user.create({ data: userDto });

    const resLinkSent = await UserService.sendWelcomeLink(newUser);

    let message = "";

    switch (resLinkSent.sentTo) {
      case NotificationChannel.EMAIL:
        message = `Verification link sent to Email: ${props.email}`;
        break;

      case NotificationChannel.WHATSAPP:
        message = `Verification link sent to WhatsApp: ${props.tel}`;
        break;

      case NotificationChannel.SMS:
        message = `Verification link sent by SMS: ${props.tel}`;
        break;
    }

    return {
      ok: true,

      data: {
        message,
        verificationMethod: resLinkSent.sentTo,
      },
    };
  } catch (error) {
    const errMessage = getFriendlyErrorMessage(error);

    console.log("User-Facing Error:", errMessage);

    return {
      ok: false,
      error: errMessage,
    };
  }
}

// ======================================================
// SET PASSWORD
// ======================================================

interface SetPasswordProps {
  username: string;
  token: string;
  password: string;
}

export async function setNewPassword(
  props: SetPasswordProps,
): Promise<ActionResult<{ success: true }>> {
  const username = typeof props?.username === "string" ? props.username : "";
  if (
    !rateLimitKey(
      hashSha256(`reset-complete:${username.trim().toLowerCase()}`),
      5,
      15 * 60 * 1000,
    )
  ) {
    return {
      ok: false,
      error: "Too many attempts. Please request a new link later.",
    };
  }
  try {
    const parsed = setPasswordSchema.safeParse({
      ...props,
      confirmPassword: props.password,
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid password",
      };
    }
    const { username, token, password } = parsed.data;

    const user = await UserService.getUserByKey(username);

    if (!user) {
      return {
        ok: false,
        error: "User not found",
      };
    }

    const tokenValidation = await UserService.verifyToken({
      token,
      username,
      type: TokenType.RESET,
    });

    if (!tokenValidation.verification) {
      return {
        ok: false,
        error: tokenValidation.message,
      };
    }

    if (!tokenValidation.verifiedChannel || !tokenValidation.tokenId) {
      return {
        ok: false,
        error: tokenValidation.message,
      };
    }

    const now = new Date();
    const hashedPassword = await bcryptHash(password);
    const consumed = await prisma.$transaction(async (tx) => {
      const currentToken = tokenValidation.tokenId
        ? await tx.token.findUnique({ where: { id: tokenValidation.tokenId } })
        : null;
      if (
        !currentToken ||
        !currentToken.isActive ||
        currentToken.expiresAt <= now ||
        currentToken.channel !== tokenValidation.verifiedChannel ||
        !(await bcryptCompare(token, currentToken.hashedToken))
      ) {
        return false;
      }

      const tokenUpdate = await tx.token.updateMany({
        where: {
          id: tokenValidation.tokenId,
          hashedToken: currentToken.hashedToken,
          userId: user.id,
          type: TokenType.RESET,
          isActive: true,
          expiresAt: { gt: now },
          channel: tokenValidation.verifiedChannel,
        },
        data: { isActive: false, lastUsedAt: now },
      });

      if (tokenUpdate.count !== 1) return false;

      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          ...(tokenValidation.verifiedChannel === NotificationChannel.EMAIL
            ? { emailVerified: now }
            : { telVerified: now }),
        },
      });

      return true;
    });

    if (!consumed) {
      return {
        ok: false,
        error: "This reset link has already been used or expired.",
      };
    }

    return {
      ok: true,
      data: {
        success: true,
      },
    };
  } catch (error) {
    console.log("ERROR:", error);

    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// SEND OTP
// ======================================================

export async function sendOtp(props: SendOtpProps): Promise<
  ActionResult<{
    sent: boolean;
    details?: ATRecipient[];
  }>
> {
  try {
    const { notificationChannel, contact } = props;

    const user = await UserService.getUserByKey(contact);

    if (!user) {
      return {
        ok: false,
        error: "User not found",
      };
    }

    const otpCode = generateRandom(6);

    const hashedToken = hashSha256(otpCode);

    await prisma.token.upsert({
      where: { type_userId: { type: TokenType.SIGN_IN, userId: user.id } },
      create: {
        hashedToken,
        type: TokenType.SIGN_IN,
        expiresAt: addToDate({ hours: 1 }),
        userId: user.id,
        description: `OTCode-sent-to-${user.id}`,
      },
      update: {},
    });

    console.log(`New OTCode generated for user-${user.id}`);

    switch (notificationChannel) {
      case NotificationChannel.SMS: {
        const smsRes = await sendSms({
          to: contact,
          message: `Hi, your Loci authentication code is ${otpCode}`,
        });

        // Check overall helper success flag
        if (!smsRes.success) {
          return {
            ok: false,
            error: smsRes.error || smsRes.message,
          };
        }

        const isSent = smsRes.recipients.some(
          (recipient) =>
            recipient.status === "Success" || recipient.statusCode === 101,
        );

        if (!isSent) {
          return {
            ok: false,
            error: smsRes.message || "SMS failed to reach recipient",
          };
        }

        return {
          ok: true,
          data: {
            sent: true,
            details: smsRes.recipients,
          },
        };
      }

      case NotificationChannel.WHATSAPP: {
        const waRes = await whatsapp.sendMessage({
          to: contact,

          type: MessageType.TEMPLATE,

          template: {
            name: "otp_verification",

            language: {
              code: "en_US",
            },

            components: [
              {
                type: "body",

                parameters: [
                  {
                    type: "text",
                    text: otpCode,
                  },
                ],
              },
            ],
          },
        });

        return {
          ok: true,
          data: {
            sent: "messages" in waRes,
          },
        };
      }

      case NotificationChannel.EMAIL:
        return {
          ok: false,
          error: "Email magic links not implemented yet",
        };

      default:
        return {
          ok: false,
          error: `Unsupported channel: ${notificationChannel}`,
        };
    }
  } catch (error) {
    console.error("Failed to send OTP:", error);

    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
