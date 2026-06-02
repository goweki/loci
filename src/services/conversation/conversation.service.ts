import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

import {
  MessageDirection,
  MessageStatus,
  Prisma,
  UserRole,
} from "@/lib/prisma/generated";
import { contactInclude, ContactWithRelations } from "../contact";

export type ConversationServiceContext = {
  userId: string;
  role: UserRole;
};

export class ConversationService {
  private userId: string;
  private role: UserRole;

  private constructor({ userId, role }: ConversationServiceContext) {
    this.userId = userId;
    this.role = role;
  }

  static async create() {
    const user = await requireUser();

    return new ConversationService({
      userId: user.id,
      role: user.role,
    });
  }

  /**
   * 🔐 Centralized access control
   */
  private scope<T extends Prisma.ContactWhereInput>(
    where: T = {} as T,
  ): Prisma.ContactWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * 🧠 DTO mapper
   */
  private toConversationDTO(contact: ContactWithRelations) {
    const latestMessage = contact.messages[0];

    const chatbotConversation = contact.chatbotConversations[0];

    return {
      id: contact.id,

      name: contact.name || contact.phoneNumber,

      phone: contact.phoneNumber,

      avatar: contact.avatar,

      message: latestMessage
        ? this.extractMessageText(latestMessage.content)
        : "No messages yet",

      direction: latestMessage?.direction,

      status: latestMessage?.status,

      time: latestMessage
        ? this.formatRelativeTime(latestMessage.timestamp)
        : "",

      unread: contact._count.messages,

      lastMessageAt: latestMessage?.timestamp,

      chatbot: chatbotConversation
        ? {
            active: chatbotConversation.isActive,

            handedOff: chatbotConversation.handedOffToHuman,
          }
        : null,
    };
  }

  /**
   * 💬 Get recent conversations
   */
  async getRecentConversations(params?: {
    search?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { search, limit = 20, cursor } = params || {};

    const contactsWithMessages = await prisma.contact.findMany({
      where: this.scope({
        OR: search
          ? [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },

              {
                phoneNumber: {
                  contains: search,
                },
              },
            ]
          : undefined,
      }),

      include: contactInclude,

      take: limit,

      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),

      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return contactsWithMessages.map((c) => this.toConversationDTO(c));
  }

  /**
   * 💬 Get single conversation
   */
  async getConversations() {
    const contactsWithMessages = await prisma.contact.findMany({
      where: this.scope(),

      include: {
        ...contactInclude,

        messages: {
          orderBy: {
            timestamp: "asc",
          },

          take: 100,
        },
      },
    });

    return contactsWithMessages.map((c) => this.toConversationDTO(c));
  }

  async getConversationWithContact(contactId: string) {
    const contactWithMessages = await prisma.contact.findFirst({
      where: this.scope({
        id: contactId,
      }),

      include: {
        ...contactInclude,

        messages: {
          orderBy: {
            timestamp: "asc",
          },

          take: 100,
        },
      },
    });

    if (!contactWithMessages) {
      throw new Error("Contact not found");
    }

    return this.toConversationDTO(contactWithMessages);
  }

  /**
   * ✉️ Send message
   */
  async sendMessage(params: {
    contactId: string;
    phoneNumberId: string;
    content: Prisma.InputJsonValue;
  }) {
    const contact = await prisma.contact.findFirst({
      where: this.scope({
        id: params.contactId,
      }),
    });

    if (!contact) {
      throw new Error("Conversation not found");
    }

    const message = await prisma.message.create({
      data: {
        userId: this.userId,

        contactId: contact.id,

        phoneNumberId: params.phoneNumberId,

        direction: MessageDirection.OUTBOUND,

        status: MessageStatus.SENT,

        timestamp: new Date(),

        content: params.content,
      },
    });

    /**
     * keep denormalized timestamp updated
     */
    await prisma.contact.update({
      where: {
        id: contact.id,
      },

      data: {
        lastMessageAt: message.timestamp,
      },
    });

    return message;
  }

  /**
   * 👁️ Mark conversation as read
   */
  async markConversationAsRead(contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: this.scope({
        id: contactId,
      }),
    });

    if (!contact) {
      throw new Error("Conversation not found");
    }

    return prisma.message.updateMany({
      where: {
        contactId,

        direction: MessageDirection.INBOUND,

        status: {
          not: MessageStatus.READ,
        },
      },

      data: {
        status: MessageStatus.READ,
      },
    });
  }

  /**
   * 🤖 Handoff chatbot → human
   */
  async handoffToHuman(contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: this.scope({
        id: contactId,
      }),

      include: {
        chatbotConversations: true,
      },
    });

    if (!contact) {
      throw new Error("Conversation not found");
    }

    const conversation = contact.chatbotConversations[0];

    if (!conversation) {
      return null;
    }

    return prisma.chatbotConversation.update({
      where: {
        id: conversation.id,
      },

      data: {
        handedOffToHuman: true,
      },
    });
  }

  /**
   * 🔎 Search messages globally
   */
  async searchMessages(query: string) {
    return prisma.message.findMany({
      where: {
        ...(this.role !== UserRole.ADMIN && {
          userId: this.userId,
        }),

        content: {
          path: [],
          string_contains: query,
        },
      },

      include: {
        contact: true,
      },

      take: 50,

      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * 📈 Unread count
   */
  async getUnreadCount() {
    return prisma.message.count({
      where: {
        ...(this.role !== UserRole.ADMIN && {
          userId: this.userId,
        }),

        direction: MessageDirection.INBOUND,

        status: {
          not: MessageStatus.READ,
        },
      },
    });
  }

  /**
   * 🧹 Archive-ready abstraction
   */
  async getActiveConversations() {
    return prisma.contact.findMany({
      where: this.scope({
        lastMessageAt: {
          not: null,
        },
      }),

      include: contactInclude,

      orderBy: {
        lastMessageAt: "desc",
      },
    });
  }

  /**
   * 🧰 Helpers
   */
  private extractMessageText(content: Prisma.JsonValue) {
    if (!content) {
      return "";
    }

    if (typeof content === "string") {
      return content;
    }

    if (typeof content === "object" && !Array.isArray(content)) {
      return (
        (content as any).text ||
        (content as any).body ||
        (content as any).message ||
        "[Media]"
      );
    }

    return "[Unsupported]";
  }

  private formatRelativeTime(date: Date) {
    const diff = Date.now() - date.getTime();

    const mins = Math.floor(diff / 1000 / 60);

    if (mins < 1) {
      return "now";
    }

    if (mins < 60) {
      return `${mins}m`;
    }

    const hours = Math.floor(mins / 60);

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d`;
  }
}
