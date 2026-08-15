"use server";

import prisma from "@/lib/prisma";
import {
  MessageType,
  NotificationChannel,
  Prisma,
  TokenType,
  UserRole,
} from "@/lib/prisma/generated";
import sendSms from "@/lib/sms";
import { addToDate } from "@/lib/utils/dateHandlers";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import {
  bcryptHash,
  generateRandom,
  hashSha256,
} from "@/lib/utils/passwordHandlers";
import { generateUniqueUsernameFromSeed } from "@/lib/utils/username";
import whatsapp from "@/lib/whatsapp";
import { UserService } from "@/services/user/user.service";
import { ActionResult } from "@/types";
import { SendOtpProps } from "./user.actions.dto";

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
}): Promise<
  ActionResult<Awaited<ReturnType<typeof UserService.sendResetLink>>>
> {
  try {
    const res = await UserService.sendResetLink(params);

    return {
      ok: true,
      data: res,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function verifyResetTokenAction(params: {
  username: string;
  token: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof UserService.verifyToken>>>> {
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
  try {
    const { username, token, password } = props;

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

    console.log(
      `[TOKEN VALIDATED]: ${tokenValidation.message} - user-${user.username}`,
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcryptHash(password),
        ...(tokenValidation.verifiedChannel === NotificationChannel.EMAIL
          ? {
              emailVerified: new Date(),
            }
          : tokenValidation.verifiedChannel === NotificationChannel.WHATSAPP ||
              tokenValidation.verifiedChannel === NotificationChannel.SMS
            ? { telVerified: new Date() }
            : {}),
      },
    });

    await prisma.token.update({
      where: { type_userId: { userId: user.id, type: TokenType.RESET } },
      data: { isActive: false },
    });

    if (!tokenValidation.verifiedChannel) {
      return {
        ok: false,
        error: tokenValidation.message,
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

export async function sendOtp(
  props: SendOtpProps,
): Promise<ActionResult<{ sent: boolean }>> {
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

        return {
          ok: true,
          data: {
            sent: smsRes.recipients.status === "fulfilled",
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
