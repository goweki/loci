"use server";

import { getUserByKey } from "@/data/user";
import { NotificationChannel } from "@/lib/prisma/generated";
import sendSms, { SMSMessageResponse, SMSprops } from "@/lib/sms";
import { removePlus } from "@/lib/utils/telHandlers";
import { Message } from "@/lib/validations";
import whatsapp from "@/lib/whatsapp";
import { SendResponse as WhatsappSendResponse } from "@/lib/whatsapp/types/waba-api-reponses";

interface SendOtpProps {
  notificationChannel: NotificationChannel;
  contact: string;
}

export async function sendOtp(props: SendOtpProps): Promise<boolean> {
  const { notificationChannel, contact } = props;
  let response = false;

  // verify contact is of a user
  const user = await getUserByKey(removePlus(contact));
  if (!user) {
    throw new Error("User not found");
  }

  switch (notificationChannel) {
    case "SMS":
      const smsMessage: SMSprops = {
        to: contact,
        message: "Hi, your Loci authentication code is",
      };
      const smsRes: SMSMessageResponse = await sendSms(smsMessage);
      const { message, receipients } = smsRes;

      if (receipients.status === "fulfilled") {
        response = true;
      } else {
        console.error(`Message not sent`, receipients, message);
      }

      return response;
    case "WHATSAPP":
      console.log(`Sending whatsapp message to ${contact}...`);
      const whatsappMessage: Message = {
        to: contact,
        type: "template",
        template: { name: "OTP", language: { code: "en_US" }, components: [] },
      };
      const waRes: WhatsappSendResponse =
        await whatsapp.sendMessage(whatsappMessage);
      if ("messages" in waRes) {
        response = true;
      } else {
        console.log(`Whatsapp message not sent:`, waRes);
      }
      return response;
    case "EMAIL":
      console.log(`Sending email to ${contact}...`);
      return true;
    default:
      throw new Error(
        `Unsupported notification channel: ${notificationChannel}`,
      );
  }
}
