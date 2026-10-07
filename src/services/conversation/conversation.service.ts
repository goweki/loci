import "server-only";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

import {
  MessageDirection,
  MessageStatus,
  MessageType,
  PhoneNumberStatus,
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
    const latestMessage = contact.messages.reduce<typeof contact.messages[number] | undefined>(
      (latest, message) => !latest || message.timestamp > latest.timestamp ? message : latest,
      undefined,
    );

    const chatbotConversation = contact.chatbotConversations.find(
      (conversation) => conversation.chatbotConfig.phoneNumberId === latestMessage?.phoneNumberId,
    );

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
      phoneNumberId: latestMessage?.phoneNumberId,

      chatbot: chatbotConversation
        ? {
            active: chatbotConversation.isActive && chatbotConversation.chatbotConfig.isActive,

            handedOff: chatbotConversation.handedOffToHuman,
          }
        : null,
      messages: contact.messages.map((message) => ({
        id: message.id,
        phoneNumberId: message.phoneNumberId,
        content: message.content,
        direction: message.direction,
        status: message.status,
        timestamp: message.timestamp,
      })),
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

  async sendWhatsAppTextMessage(params: {
    contactId: string;
    phoneNumberId: string;
    text: string;
  }) {
    const text = params.text.trim();
    if (!text || text.length > 4000) throw new Error("Message must contain 1–4000 characters.");

    const [contact, phoneNumber] = await Promise.all([
      prisma.contact.findFirst({
        where: this.scope({ id: params.contactId }),
      }),
      prisma.phoneNumber.findFirst({
        where: {
          id: params.phoneNumberId,
          status: PhoneNumberStatus.VERIFIED,
          waba: { userId: this.userId },
        },
      }),
    ]);
    if (!contact || !phoneNumber) throw new Error("Conversation or WhatsApp number not found.");

    const lastInbound = await prisma.message.findFirst({
      where: {
        userId: this.userId,
        contactId: contact.id,
        phoneNumberId: phoneNumber.id,
        direction: MessageDirection.INBOUND,
      },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    });
    if (!lastInbound || Date.now() - lastInbound.timestamp.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error("A free-form reply is unavailable outside the WhatsApp customer service window. Use an approved template.");
    }

    const { default: whatsapp } = await import("@/lib/whatsapp");
    const providerResponse = await whatsapp.sendMessage({
      phoneNumberId: phoneNumber.id,
      to: contact.phoneNumber,
      type: MessageType.TEXT,
      text: { body: text },
    });
    if ("error" in providerResponse) throw new Error(providerResponse.error.message);

    const message = await prisma.message.create({
      data: {
        userId: this.userId,
        contactId: contact.id,
        phoneNumberId: phoneNumber.id,
        waMessageId: providerResponse.messages[0]?.id,
        type: MessageType.TEXT,
        content: { text },
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.SENT,
        timestamp: new Date(),
      },
    });
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastMessageAt: message.timestamp },
    });

    await prisma.chatbotConversation.updateMany({
      where: {
        contactId: contact.id,
        chatbotConfig: { phoneNumberId: phoneNumber.id },
      },
      data: { handedOffToHuman: true, isActive: false },
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
        isActive: false,
      },
    });
  }

  async setAssistantHandoff(contactId: string, phoneNumberId: string, handedOff: boolean) {
    const contact = await prisma.contact.findFirst({
      where: this.scope({ id: contactId }),
      select: { id: true },
    });
    if (!contact) throw new Error("Conversation not found");

    const config = await prisma.chatbotConfig.findFirst({
      where: {
        phoneNumberId,
        phoneNumber: { waba: { userId: this.userId } },
      },
      select: { id: true, isActive: true },
    });
    if (!config) throw new Error("Assistant not found or access denied");

    return prisma.chatbotConversation.upsert({
      where: {
        chatbotConfigId_contactId: {
          chatbotConfigId: config.id,
          contactId,
        },
      },
      create: {
        chatbotConfigId: config.id,
        contactId,
        context: {},
        isActive: config.isActive && !handedOff,
        handedOffToHuman: handedOff,
      },
      update: {
        handedOffToHuman: handedOff,
        isActive: config.isActive && !handedOff,
        ...(handedOff ? {} : { context: {}, messageCount: 0 }),
        lastMessageAt: new Date(),
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
