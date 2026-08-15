import { NotificationChannel } from "@/lib/prisma/generated";

export interface SendOtpProps {
  notificationChannel: NotificationChannel;
  contact: string;
}
