import { CommunicationChannel } from "@/lib/prisma/generated";

export interface NewMessageDTO {
  contact: string;
  channel: CommunicationChannel;
  template: string;
  message: string;
}
