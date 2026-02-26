"use server";

import { getUserByKey, updateUserPassword, verifyToken } from "@/data/user";
import { hashApiKey } from "@/lib/auth/api-key";
import prisma from "@/lib/prisma";
import { NotificationChannel, TokenType } from "@/lib/prisma/generated";
import sendSms from "@/lib/sms";
import { addToDate } from "@/lib/utils/dateHandlers";
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
  confirmPassword: string;
}

export async function setNewPassword(
  props: SetPasswordProps,
): Promise<boolean> {
  const { username, token, password, confirmPassword } = props;

  const user = await getUserByKey(username);
  if (!user) {
    throw new Error(`User not found: ${username}`);
  }

  const tokenValidation = await verifyToken({ token, username });
  if (!tokenValidation.verification) {
    throw new Error(`Invalid token`);
  }

  const updatedUser_ = await updateUserPassword(user.id, { password });
  return !!updatedUser_;
}
