"use server";

import { NotificationChannel } from "@/lib/prisma/generated";

interface SendOtpProps {
  notificationChannel: NotificationChannel;
  contact: string;
}

export function SendOtp(props: SendOtpProps) {
  const { notificationChannel, contact } = props;

  switch (notificationChannel) {
    case "EMAIL":
      return `Sending email to ${contact}...`;
    case "SMS":
      return `Sending text to ${contact}...`;
    case "WHATSAPP":
      return `Sending whatsapp message to ${contact}...`;
    default:
      throw new Error(
        `Unsupported notification channel: ${notificationChannel}`,
      );
  }
}
