import { sms } from "./client";
const SENDER_ID = process.env.AFRICASTALKING_SENDER_ID;

export interface SMSprops {
  to: string | string[];
  message: string;
  from?: string;
}

export interface SMSMessageResponse {
  message: string;
  receipients: {
    statusCode: number;
    number: string;
    status: "fulfilled" | "failed";
    cost: string;
    messageId: string;
  };
}

export default async function sendSms(options: SMSprops) {
  if (!SENDER_ID) {
    throw new Error("missing .env AFRICASTALKING_SENDER_ID");
  }
  const smsOptions = { ...options, from: options.from || SENDER_ID };

  return sms
    .send(smsOptions)
    .then((response) => {
      console.log("SMS sent successfully:", response);
      return response;
    })
    .catch((error) => {
      console.error("SMS sending failed:", error);
      throw error;
    });
}
