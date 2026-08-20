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

export interface SMSRecipient {
  number: string;
  status: string; // "Success", "Failed", etc.
  cost: string;
  messageId: string;
}

export interface SMSMessageResponse {
  message: string;
  recipients: unknown;
}

/**
 * Reusable Next.js 15 Server-Safe SMS dispatcher via Africa's Talking SDK
 */
export default async function sendSms(options: SMSprops) {
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
    console.log("[SENDING SMS] :", smsOptions);
    const response = await sms.send(smsOptions);

    // Cast through unknown to override the inaccurate SDK typing
    const rawResponse = response as unknown as SMSResponse;
    const messageData = rawResponse.SMSMessageData;

    console.log("[SMS service response]: Full Payload-", messageData);
    console.log("[SMS service response]: Message-", messageData.Message);
    console.log("[SMS service response]: Recipients-", messageData.Recipients);

    return {
      message: response.Message,
      recipients: response.Recipients,
    };
  } catch (error) {
    console.error("❌ SMS transmission failed:", error);
    throw error;
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
