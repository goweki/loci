import prisma from "@/lib/prisma";
import { ChatbotConfig, Prisma } from "@/lib/prisma/generated";

// ==================== CHATBOT CONFIG FUNCTIONS ====================

/**
 * Create a chatbot configuration for a phone number
 */
export async function createChatbotConfig(
  data:
    | Prisma.ChatbotConfigCreateInput
    | Prisma.ChatbotConfigUncheckedCreateInput
) {
  return await prisma.chatbotConfig.create({
    data,
    include: {
      phoneNumber: true,
    },
  });
}

/**
 * Get chatbot config by phone number ID
 */
export async function getChatbotConfig(phoneNumberId: string) {
  return await prisma.chatbotConfig.findUnique({
    where: { phoneNumberId },
    include: {
      phoneNumber: true,
    },
  });
}

/**
 * Update chatbot configuration
 */
export async function updateChatbotConfig(
  phoneNumberId: string,
  data: Partial<ChatbotConfig>
) {
  return await prisma.chatbotConfig.update({
    where: { phoneNumberId },
    data,
  });
}

/**
 * Delete chatbot configuration
 */
export async function deleteChatbotConfig(phoneNumberId: string) {
  return await prisma.chatbotConfig.delete({
    where: { phoneNumberId },
  });
}

/**
 * Toggle chatbot active status
 */
export async function toggleChatbotStatus(
  phoneNumberId: string,
  isActive: boolean
) {
  return await prisma.chatbotConfig.update({
    where: { phoneNumberId },
    data: { isActive },
  });
}

// ==================== CONVERSATION FUNCTIONS ====================

/**
 * Get or create a conversation for a contact
 */
export async function getOrCreateConversation(
  chatbotConfigId: string,
  contactId: string
) {
  // Try to find existing active conversation
  let conversation = await prisma.chatbotConversation.findUnique({
    where: {
      chatbotConfigId_contactId: {
        chatbotConfigId,
        contactId,
      },
    },
    include: {
      chatbotConfig: true,
      contact: true,
    },
  });

  // Check if conversation should be reset due to inactivity
  if (conversation) {
    const config = conversation.chatbotConfig;
    const minutesSinceLastMessage =
      (Date.now() - conversation.lastMessageAt.getTime()) / 1000 / 60;

    if (minutesSinceLastMessage > config.resetContextAfter) {
      // Reset the conversation context
      conversation = await prisma.chatbotConversation.update({
        where: { id: conversation.id },
        data: {
          context: {},
          messageCount: 0,
          isActive: true,
          handedOffToHuman: false,
          lastMessageAt: new Date(),
        },
        include: {
          chatbotConfig: true,
          contact: true,
        },
      });
    }
  }

  // Create new conversation if it doesn't exist
  if (!conversation) {
    conversation = await prisma.chatbotConversation.create({
      data: {
        chatbotConfigId,
        contactId,
        context: {},
        messageCount: 0,
      },
      include: {
        chatbotConfig: true,
        contact: true,
      },
    });
  }

  return conversation;
}

/**
 * Update conversation context and metadata
 */
export async function updateConversation(
  conversationId: string,
  data: {
    context?: any;
    messageCount?: number;
    isActive?: boolean;
    handedOffToHuman?: boolean;
  }
) {
  return await prisma.chatbotConversation.update({
    where: { id: conversationId },
    data: {
      ...data,
      lastMessageAt: new Date(),
    },
  });
}

/**
 * Get conversation history (recent messages)
 */
export async function getConversationHistory(
  contactId: string,
  phoneNumberId: string,
  limit: number = 10
) {
  return await prisma.message.findMany({
    where: {
      contactId,
      phoneNumberId,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
    select: {
      id: true,
      type: true,
      content: true,
      direction: true,
      timestamp: true,
    },
  });
}

/**
 * Mark conversation as handed off to human
 */
export async function handoffToHuman(conversationId: string) {
  return await prisma.chatbotConversation.update({
    where: { id: conversationId },
    data: {
      handedOffToHuman: true,
      isActive: false,
    },
  });
}

/**
 * Reactivate conversation (bring back from human handoff)
 */
export async function reactivateConversation(conversationId: string) {
  return await prisma.chatbotConversation.update({
    where: { id: conversationId },
    data: {
      handedOffToHuman: false,
      isActive: true,
      context: {}, // Reset context when reactivating
      messageCount: 0,
    },
  });
}

/**
 * Get all active conversations for a chatbot
 */
export async function getActiveConversations(chatbotConfigId: string) {
  return await prisma.chatbotConversation.findMany({
    where: {
      chatbotConfigId,
      isActive: true,
      handedOffToHuman: false,
    },
    include: {
      contact: true,
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  });
}

// ==================== PROMPT TEMPLATE FUNCTIONS ====================

/**
 * Create a prompt template
 */
export async function createPromptTemplate(data: {
  userId: string;
  name: string;
  description?: string;
  content: string;
  category?: string;
  isPublic?: boolean;
}) {
  return await prisma.promptTemplate.create({
    data,
  });
}

/**
 * Get user's prompt templates
 */
export async function getUserPromptTemplates(userId: string) {
  return await prisma.promptTemplate.findMany({
    where: {
      OR: [{ userId }, { isPublic: true }],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get prompt template by ID
 */
export async function getPromptTemplate(id: string) {
  return await prisma.promptTemplate.findUnique({
    where: { id },
  });
}

/**
 * Update prompt template
 */
export async function updatePromptTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    content?: string;
    category?: string;
    isPublic?: boolean;
  }
) {
  return await prisma.promptTemplate.update({
    where: { id },
    data,
  });
}

/**
 * Delete prompt template
 */
export async function deletePromptTemplate(id: string) {
  return await prisma.promptTemplate.delete({
    where: { id },
  });
}

/**
 * Search prompt templates by category
 */
export async function searchPromptTemplates(userId: string, category?: string) {
  return await prisma.promptTemplate.findMany({
    where: {
      OR: [{ userId }, { isPublic: true }],
      ...(category && { category }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if message should trigger human handoff
 */
export function shouldHandoffToHuman(
  message: string,
  keywords: string[]
): boolean {
  const lowerMessage = message.toLowerCase();
  return keywords.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );
}

/**
 * Build conversation context for AI
 */
export async function buildConversationContext(
  contactId: string,
  phoneNumberId: string,
  conversationHistory: number
) {
  const messages = await getConversationHistory(
    contactId,
    phoneNumberId,
    conversationHistory
  );

  // Reverse to get chronological order
  return messages.reverse().map((msg) => ({
    role: msg.direction === "INBOUND" ? "user" : "assistant",
    content:
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content),
    timestamp: msg.timestamp,
  }));
}

/**
 * Format system prompt with dynamic variables
 */
export function formatSystemPrompt(
  systemPrompt: string,
  variables: Record<string, string>
): string {
  let formatted = systemPrompt;

  for (const [key, value] of Object.entries(variables)) {
    formatted = formatted.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  return formatted;
}

// ==================== ANALYTICS FUNCTIONS ====================

/**
 * Get chatbot statistics
 */
export async function getChatbotStats(chatbotConfigId: string) {
  const conversations = await prisma.chatbotConversation.findMany({
    where: { chatbotConfigId },
  });

  const totalConversations = conversations.length;
  const activeConversations = conversations.filter((c) => c.isActive).length;
  const handedOffConversations = conversations.filter(
    (c) => c.handedOffToHuman
  ).length;
  const totalMessages = conversations.reduce(
    (sum, c) => sum + c.messageCount,
    0
  );

  return {
    totalConversations,
    activeConversations,
    handedOffConversations,
    totalMessages,
    avgMessagesPerConversation:
      totalConversations > 0 ? totalMessages / totalConversations : 0,
    handoffRate:
      totalConversations > 0
        ? (handedOffConversations / totalConversations) * 100
        : 0,
  };
}

export default {
  createChatbotConfig,
  getChatbotConfig,
  updateChatbotConfig,
  deleteChatbotConfig,
  toggleChatbotStatus,
  getOrCreateConversation,
  updateConversation,
  getConversationHistory,
  handoffToHuman,
  reactivateConversation,
  getActiveConversations,
  createPromptTemplate,
  getUserPromptTemplates,
  getPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  searchPromptTemplates,
  shouldHandoffToHuman,
  buildConversationContext,
  formatSystemPrompt,
  getChatbotStats,
};
