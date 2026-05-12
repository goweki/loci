// services/ConversationService.ts

import prisma from "@/lib/prisma";
import { ContactWithRelations } from "../contact/contact.dto";
import { requireUser } from "@/lib/auth";

export class ConversationService {
  static async getRecentConversations(userId?: string) {
    const user = await requireUser();
    if (user.role) {
    }
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
      },

      include: {
        messages: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },

        _count: {
          select: {
            messages: {
              where: {
                direction: "INBOUND",
                status: {
                  not: "READ",
                },
              },
            },
          },
        },
      },

      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return contacts.map((contact) => this.toConversationDTO(contact));
  }

  static toConversationDTO(contact: ContactWithRelations) {
    const latestMessage = contact.messages[0];

    return {
      id: contact.id,
      name: contact.name || contact.phoneNumber,
      phone: contact.phoneNumber,

      message: latestMessage
        ? this.extractMessageText(latestMessage.content)
        : "No messages yet",

      time: latestMessage
        ? this.formatRelativeTime(latestMessage.timestamp)
        : "",

      unread: contact._count.messages,

      avatar: contact.avatar,
    };
  }

  static extractMessageText(content: any) {
    if (!content) return "";

    if (typeof content === "string") {
      return content;
    }

    return content.text || content.body || "[Media]";
  }

  static formatRelativeTime(date: Date) {
    const diff = Date.now() - date.getTime();

    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;

    const hours = Math.floor(mins / 60);

    if (hours < 24) return `${hours}h`;

    return `${Math.floor(hours / 24)}d`;
  }
}
