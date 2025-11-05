import { sms } from "./client";

interface SMSOptions {
  to: string | string[];
  from: string;
  message: string;
}

interface SMSMessageData {
  Message: string;
  Recipients: {
    statusCode: number;
    number: string;
    status: "fulfilled" | "failed";
    cost: string;
    messageId: string;
  };
}

export default async function sendSms(options: SMSOptions) {
  return sms
    .send(options)
    .then((response: SMSMessageData) => {
      console.log("SMS sent successfully:", response);
      return response;
    })
    .catch((error) => {
      console.error("SMS sending failed:", error);
      throw error;
    });
}
