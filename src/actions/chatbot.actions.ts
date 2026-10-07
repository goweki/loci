"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const chatbotConfigSchema = z.object({
  phoneNumberId: z.string().min(1),
  systemPrompt: z.string().trim().min(20).max(12000),
  profileContext: z.string().trim().max(10000).default(""),
  isActive: z.boolean(),
  enabledTools: z.array(z.enum(["search_catalogue"])).default([]),
  temperature: z.number().min(0).max(1).default(0.4),
  maxTokens: z.number().int().min(64).max(2000).default(800),
  humanHandoffKeywords: z.array(z.string().trim().min(1).max(50)).max(20),
  conversationHistory: z.number().int().min(1).max(30).default(10),
  resetContextAfter: z.number().int().min(1).max(1440).default(30),
});

async function requireOwnedPhoneNumber(phoneNumberId: string, userId: string) {
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: { id: phoneNumberId, waba: { userId } },
    select: { id: true },
  });

  if (!phoneNumber) throw new Error("WhatsApp number not found or access denied.");
  return phoneNumber;
}

export async function getChatbotSetup() {
  const user = await requireUser();
  return prisma.phoneNumber.findMany({
    where: { waba: { userId: user.id } },
    select: {
      id: true,
      phoneNumber: true,
      displayName: true,
      status: true,
      chatbotConfig: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveChatbotConfig(input: unknown) {
  const user = await requireUser();
  const data = chatbotConfigSchema.parse(input);
  await requireOwnedPhoneNumber(data.phoneNumberId, user.id);

  return prisma.chatbotConfig.upsert({
    where: { phoneNumberId: data.phoneNumberId },
    create: {
      phoneNumberId: data.phoneNumberId,
      systemPrompt: data.systemPrompt,
      profileContext: data.profileContext,
      isActive: data.isActive,
      enabledTools: data.enabledTools,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      humanHandoffKeywords: data.humanHandoffKeywords,
      conversationHistory: data.conversationHistory,
      resetContextAfter: data.resetContextAfter,
    },
    update: {
      systemPrompt: data.systemPrompt,
      profileContext: data.profileContext,
      isActive: data.isActive,
      enabledTools: data.enabledTools,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      humanHandoffKeywords: data.humanHandoffKeywords,
      conversationHistory: data.conversationHistory,
      resetContextAfter: data.resetContextAfter,
    },
  });
}

export async function toggleChatbotStatus(phoneNumberId: string, isActive: boolean) {
  const user = await requireUser();
  await requireOwnedPhoneNumber(phoneNumberId, user.id);
  return prisma.chatbotConfig.update({
    where: { phoneNumberId },
    data: { isActive },
  });
}
