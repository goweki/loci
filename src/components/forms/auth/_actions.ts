"use server";

import { tokenRepository } from "@/data/repositories/token.repository";
import { registerUser, updateUserPassword } from "@/data/user";

import { hashToken } from "@/lib/auth/token-handlers";

import prisma from "@/lib/prisma";

import { NotificationChannel, TokenType } from "@/lib/prisma/generated";

import sendSms from "@/lib/sms";

import { addToDate } from "@/lib/utils/dateHandlers";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { generateRandom } from "@/lib/utils/passwordHandlers";

import whatsapp from "@/lib/whatsapp";

import { UserService } from "@/services/user/user.service";
import { ActionResult } from "@/types";

// ======================================================
// SEND OTP
// ======================================================

interface SendOtpProps {
  notificationChannel: NotificationChannel;
  contact: string;
}

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

    const otpCode = await generateRandom(6);

    const hashedToken = hashToken(otpCode);

    await tokenRepository.upsertToken({
      hashedToken,
      type: TokenType.SIGN_IN,
      expiresAt: addToDate({ hours: 1 }),
      userId: user.id,
      description: `OTCode-sent-to-${user.id}`,
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

          type: "template",

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

// ======================================================
// VERIFY OTP
// ======================================================

interface VerifyOtpProps {
  userId: string;
  otpVal: string;
}

export async function verifyAndClearOtp(
  props: VerifyOtpProps,
): Promise<ActionResult<{ verified: boolean }>> {
  try {
    const { userId, otpVal } = props;

    if (!otpVal) {
      return {
        ok: false,
        error: "OTP is required",
      };
    }

    const hashedToken = hashToken(otpVal);

    const deleteResult = await prisma.token.deleteMany({
      where: {
        hashedToken,
        userId,

        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return {
      ok: true,
      data: {
        verified: deleteResult.count > 0,
      },
    };
  } catch (error) {
    console.error("OTP Verification Error:", error);

    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
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

    await updateUserPassword(user.id, {
      password,
    });

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
    const signupRes = await registerUser(props);

    let message = "Verification sent";

    switch (signupRes.verificationMethod) {
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
        verificationMethod: signupRes.verificationMethod,
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
// SEND RESET LINK
// ======================================================

interface SendResetLinkProps {
  username: string;
  sendTo: NotificationChannel;
}

export async function sendResetLink(props: SendResetLinkProps): Promise<
  ActionResult<{
    sentTo: NotificationChannel;
  }>
> {
  try {
    const result = await UserService.sendResetLink({
      username: props.username,
      sendTo: props.sendTo,
    });

    return {
      ok: true,

      data: {
        sentTo: result.sentTo,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// VERIFY RESET TOKEN
// ======================================================

interface VerifyResetTokenProps {
  username: string;
  token: string;
}

export async function verifyResetToken(props: VerifyResetTokenProps): Promise<
  ActionResult<{
    verification: boolean;
    message: string;
  }>
> {
  try {
    const { username, token } = props;

    const result = await UserService.verifyToken({
      username,
      token,
      type: TokenType.RESET,
    });

    return {
      ok: true,

      data: {
        verification: result.verification,
        message: result.message,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

// ======================================================
// GET USER
// ======================================================

export async function getUserByKey(userId: string): Promise<ActionResult<any>> {
  try {
    const user = await UserService.getUserByKey(userId);

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
