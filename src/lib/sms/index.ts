// import { sms } from "./client";
// const SENDER_ID = process.env.AFRICASTALKING_SENDER_ID;

// export interface SMSprops {
//   to: string | string[];
//   message: string;
//   from?: string;
// }

// export interface SMSMessageResponse {
//   message: string;
//   recipients: {
//     statusCode: number;
//     number: string;
//     status: "fulfilled" | "failed";
//     cost: string;
//     messageId: string;
//   };
// }

// export default async function sendSms(options: SMSprops) {
//   // if (!SENDER_ID && !options.from) {
//   //   throw new Error("[AFRICASTALKING] missing 'from' in SMS options'");
//   // }
//   if (!SENDER_ID) {
//     throw new Error("missing env.AFRICASTALKING_SENDER_ID");
//   }
//   const smsOptions = { ...options, from: options.from || SENDER_ID };

//   return sms
//     .send(smsOptions)
//     .then((response) => {
//       console.log("SMS sent successfully:", response);
//       return { message: response.Message, recipients: response.Recipients };
//     })
//     .catch((error) => {
//       console.error("SMS sending failed:", error);
//       throw error;
//     });
// }

import "server-only";
import { sms, SMSResponse } from "./client";
import prisma from "../prisma";
import { PhoneNumberStatus } from "../prisma/generated";

const SENDER_ID = process.env.AFRICASTALKING_SENDER_ID;

export interface SMSprops {
  to: string | string[];
  message: string;
  from?: string;
}

export interface ATRecipient {
  statusCode: number;
  number: string;
  status: string;
  cost: string;
  messageId: string;
}

export interface SendSmsResult {
  success: boolean;
  message: string;
  recipients: ATRecipient[];
  error?: string;
}

export default async function sendSms(
  options: SMSprops,
): Promise<SendSmsResult> {
  const activeSender = options.from || SENDER_ID;
  if (!activeSender) {
    throw new Error("[AFRICASTALKING] Missing sender identifier.");
  }

  const smsOptions = {
    to: options.to,
    message: options.message,
    from: activeSender,
  };

  try {
    console.log("[SENDING SMS]:", smsOptions);
    const rawResponse = (await sms.send(smsOptions)) as any;

    // 1. Safe extraction (handles both wrapped and unwrapped response shapes)
    const payload = rawResponse?.SMSMessageData || rawResponse;
    const message = payload?.Message || "No message summary returned";
    const recipients: ATRecipient[] = Array.isArray(payload?.Recipients)
      ? payload.Recipients
      : [];

    console.log("[SMS service response]: Message-", message);
    console.log("[SMS service response]: Recipients-", recipients);

    // 2. Handle empty recipients or API-level error status messages
    if (recipients.length === 0) {
      console.warn(`⚠️ SMS dispatch warning: ${message}`);
      return {
        success: false,
        message,
        recipients: [],
        error: `Provider returned non-success state: ${message}`,
      };
    }

    // 3. Inspect individual recipient statuses (e.g., status code 101/100 is successful)
    const failedRecipients = recipients.filter(
      (r) =>
        r.status !== "Success" && r.statusCode !== 101 && r.statusCode !== 100,
    );

    if (failedRecipients.length > 0) {
      console.warn(
        "⚠️ Some recipients failed to receive the message:",
        failedRecipients,
      );
    }

    return {
      success: failedRecipients.length < recipients.length,
      message,
      recipients,
    };
  } catch (error: any) {
    console.error("❌ SMS network or SDK error:", error?.message || error);
    return {
      success: false,
      message: "SDK Network or Authentication Error",
      recipients: [],
      error: error?.message || "Unknown error",
    };
  }
}

export async function getDefaultSmsPhoneNumberId() {
  if (!SENDER_ID)
    throw new Error("Missing env AFRICASTALKING_SENDER_ID && !{{from}} ");

  return prisma.phoneNumber.upsert({
    where: { id: SENDER_ID },
    create: {
      id: SENDER_ID,
      phoneNumber: SENDER_ID,
      displayName: SENDER_ID,
      status: PhoneNumberStatus.VERIFIED,
    },
    update: {
      phoneNumber: SENDER_ID,
      displayName: SENDER_ID,
      status: PhoneNumberStatus.VERIFIED,
    },
  });
}
