"use server";

import { Prisma, TriggerType, AutoReplyRule } from "@/lib/prisma/generated";
import prisma from "@/lib/prisma";

/**
 * Get all auto-reply rules
 * Optional filters: phoneNumberId, createdById, activeOnly
 */
export async function getAllAutoReplyRules(input?: {
  phoneNumberId?: string;
  createdById?: string;
  activeOnly?: boolean;
}): Promise<Prisma.AutoReplyRuleGetPayload<{}>[]> {
  return prisma.autoReplyRule.findMany({
    where: {
      phoneNumberId: input?.phoneNumberId,
      createdById: input?.createdById,
      ...(input?.activeOnly
        ? {
            active: true,
            isActive: true,
          }
        : {}),
    },
    orderBy: [
      { phoneNumberId: "asc" },
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });
}

/**
 * Create a new auto-reply rule
 */
export async function createAutoReplyRule(input: {
  phoneNumberId: string;
  createdById: string;
  name: string;
  triggerType: TriggerType;
  triggerValue?: string;
  replyMessage: string;
  priority?: number;
  isActive?: boolean;
}): Promise<Prisma.AutoReplyRuleGetPayload<{}>> {
  return prisma.autoReplyRule.create({
    data: {
      phoneNumberId: input.phoneNumberId,
      createdById: input.createdById,
      name: input.name,
      triggerType: input.triggerType,
      triggerValue: input.triggerValue,
      replyMessage: input.replyMessage,
      priority: input.priority ?? 0,
      isActive: input.isActive ?? true,
      active: true,
    },
  });
}

/**
 * Get all active rules for a phone number (ordered by priority)
 */
export async function getAutoReplyRulesByPhoneNumber(
  phoneNumberId: string
): Promise<Prisma.AutoReplyRuleGetPayload<{}>[]> {
  return prisma.autoReplyRule.findMany({
    where: {
      phoneNumberId,
      isActive: true,
      active: true,
    },
    orderBy: {
      priority: "asc",
    },
  });
}

/**
 * Get a single rule by ID
 */
export async function getAutoReplyRuleById(
  ruleId: string
): Promise<Prisma.AutoReplyRuleGetPayload<{}> | null> {
  return prisma.autoReplyRule.findUnique({
    where: { id: ruleId },
  });
}

/**
 * Update an auto-reply rule
 */
export async function updateAutoReplyRule(
  ruleId: string,
  data: Partial<{
    name: string;
    triggerType: TriggerType;
    triggerValue: string | null;
    replyMessage: string;
    priority: number;
    isActive: boolean;
  }>
): Promise<Prisma.AutoReplyRuleGetPayload<{}>> {
  return prisma.autoReplyRule.update({
    where: { id: ruleId },
    data,
  });
}

/**
 * Soft-disable a rule (recommended over delete)
 */
export async function deactivateAutoReplyRule(
  ruleId: string
): Promise<Prisma.AutoReplyRuleGetPayload<{}>> {
  return prisma.autoReplyRule.update({
    where: { id: ruleId },
    data: {
      active: false,
      isActive: false,
    },
  });
}

/**
 * Permanently delete a rule
 */
export async function deleteAutoReplyRule(ruleId: string): Promise<void> {
  await prisma.autoReplyRule.delete({
    where: { id: ruleId },
  });
}

/**
 * Find the first matching rule for an incoming message
 * (used by message processor / webhook)
 */
export async function matchAutoReplyRule(input: {
  phoneNumberId: string;
  messageText?: string;
  messageType?: string;
}): Promise<AutoReplyRule | null> {
  const rules = await prisma.autoReplyRule.findMany({
    where: {
      phoneNumberId: input.phoneNumberId,
      isActive: true,
      active: true,
    },
    orderBy: { priority: "asc" },
  });

  for (const rule of rules) {
    switch (rule.triggerType) {
      case TriggerType.DEFAULT:
        return rule;

      case TriggerType.KEYWORD:
        if (
          input.messageText &&
          rule.triggerValue &&
          input.messageText
            .toLowerCase()
            .includes(rule.triggerValue.toLowerCase())
        ) {
          return rule;
        }
        break;

      case TriggerType.MESSAGE_TYPE:
        if (rule.triggerValue === input.messageType) {
          return rule;
        }
        break;

      case TriggerType.TIME_BASED:
        // Implement time logic if needed
        break;
    }
  }

  return null;
}
