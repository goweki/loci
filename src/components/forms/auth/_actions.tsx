"use server";

import {
  getUserById,
  getUserByKey,
  registerUser,
  sendResetLink,
  updateUserPassword,
  verifyToken,
} from "@/data/user";
import { hashApiKey } from "@/lib/auth/api-key";
import prisma from "@/lib/prisma";
import { NotificationChannel, TokenType } from "@/lib/prisma/generated";
import sendSms from "@/lib/sms";
import { addToDate } from "@/lib/utils/dateHandlers";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { generateRandom } from "@/lib/utils/passwordHandlers";
import { removePlus } from "@/lib/utils/telHandlers";
import whatsapp from "@/lib/whatsapp";

interface SendOtpProps {
  notificationChannel: NotificationChannel;
  contact: string;
}

interface VerifyOtpProps {
  userId: string;
  otpVal: string;
}

export async function sendOtp({
  notificationChannel,
  contact,
}: SendOtpProps): Promise<boolean> {
  const cleanContact = removePlus(contact);
  const user = await getUserByKey(cleanContact);

  if (!user) throw new Error("User not found");

  // Generate  OTP and save it to the DB here
  const otpCode = await generateRandom(6);
  const hashedToken = hashApiKey(otpCode);
  await prisma.token.create({
    data: {
      hashedToken,
      type: TokenType.SIGN_IN,
      expires: addToDate({ hours: 1 }),
      userId: user.id,
    },
  });

  console.log(`New token generated for user-${user.id}`);

  try {
    switch (notificationChannel) {
      case "SMS": {
        const smsRes = await sendSms({
          to: contact,
          message: `Hi, your Loci authentication code is ${otpCode}`,
        });
        return smsRes.recipients.status === "fulfilled";
      }

      case "WHATSAPP": {
        const waRes = await whatsapp.sendMessage({
          to: contact,
          type: "template",
          template: {
            name: "otp_verification", // WABA template name
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otpCode }],
              },
            ],
          },
        });
        return "messages" in waRes;
      }

      case "EMAIL":
        throw new Error("Email magic links not implemented yet");

      default:
        throw new Error(`Unsupported channel: ${notificationChannel}`);
    }
  } catch (error) {
    console.error(`Failed to send OTP via ${notificationChannel}:`, error);
    return false;
  }
}

export async function verifyAndClearOtp({
  userId,
  otpVal,
}: VerifyOtpProps): Promise<boolean> {
  if (!otpVal) return false;

  const hashedToken = hashApiKey(otpVal);

  try {
    const deleteResult = await prisma.token.deleteMany({
      where: {
        hashedToken,
        userId,
        expires: { gt: new Date() },
      },
    });

    return deleteResult.count > 0;
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return false;
  }
}

interface SetPasswordProps {
  username: string;
  token: string;
  password: string;
}

export async function setNewPassword(
  props: SetPasswordProps,
): Promise<{ success?: string; error?: string }> {
  const { username, token, password } = props;

  const user = await getUserByKey(username);
  if (!user) {
    return { error: "User not found" };
  }

  const tokenValidation = await verifyToken({ token, username });
  if (!tokenValidation.verification) {
    return { error: "Invalid token" };
  }

  const updatedUser_ = await updateUserPassword(user.id, { password });
  return { success: `Password updated` };
}

interface SignUpProps {
  name: string;
  email?: string;
  tel?: string;
  verificationMethod: NotificationChannel;
}

export async function signUpUser(
  props: SignUpProps,
): Promise<{ success: boolean; message: string }> {
  try {
    const signupRes = await registerUser(props);

    if (signupRes.verificationMethod === NotificationChannel.EMAIL) {
      const message = `Verification link sent to Email: ${props.email}`;
      return { success: true, message };
    } else if (signupRes.verificationMethod === NotificationChannel.WHATSAPP) {
      const message = `Verification link sent to WhatsApp: ${props.tel}`;
      return { success: true, message };
    } else if (signupRes.verificationMethod === NotificationChannel.SMS) {
      const message = `Verification link sent by sms: ${props.tel}`;
      return { success: true, message };
    }
    return { success: false, message: "Unknown error" };
  } catch (error) {
    const errMessage = getFriendlyErrorMessage(error);
    return { success: false, message: errMessage };
  }
}

interface SendResetLinkProps {
  username: string;
  sendTo: NotificationChannel;
}
export async function _sendResetLink(
  props: SendResetLinkProps,
): Promise<{ sentTo?: NotificationChannel; error?: string }> {
  try {
    const result = await sendResetLink({
      username: props.username,
      sendTo: props.sendTo,
    });

    if (result) {
      return { sentTo: result.sentTo };
    }
    throw new Error("Error sending reset link");
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    // console.log("Error-Message: ", errorMessage);
    return { error: errorMessage };
  }
}

export async function _verifyToken(props: { username: string; token: string }) {
  const { username, token } = props;
  return verifyToken({ username, token });
}

export async function _getUserByKey(userId: string) {
  return getUserByKey(userId);
}
