"use server";

import { TriggerType } from "@/lib/prisma/generated";
import { AutoReplyService } from "@/services/autoReply/autoreply.service";
import { z } from "zod";

const ruleSchema = z.object({
  phoneNumberId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  triggerType: z.nativeEnum(TriggerType),
  triggerValue: z.string().trim().max(200).optional().nullable(),
  replyMessage: z.string().trim().min(1).max(4000),
  priority: z.number().int().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
}).superRefine((rule, context) => {
  if ((rule.triggerType === TriggerType.KEYWORD || rule.triggerType === TriggerType.MESSAGE_TYPE) && !rule.triggerValue) {
    context.addIssue({ code: "custom", path: ["triggerValue"], message: "A trigger value is required." });
  }
  if (rule.triggerType === TriggerType.TIME_BASED) {
    context.addIssue({ code: "custom", path: ["triggerType"], message: "Time-based rules are not available yet." });
  }
});

export async function getAllAutoReplyRules(phoneNumberId?: string) {
  const service = await AutoReplyService.create();
  return service.getAllAutoReplyRules(phoneNumberId);
}

export async function createAutoReplyRule(input: unknown) {
  const data = ruleSchema.parse(input);
  const service = await AutoReplyService.create();
  return service.createAutoReplyRule({
    ...data,
    triggerValue: data.triggerValue || null,
  });
}

export async function updateAutoReplyRule(ruleId: string, input: unknown) {
  const data = ruleSchema.partial().parse(input);
  const service = await AutoReplyService.create();
  return service.updateAutoReplyRule(ruleId, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.triggerType !== undefined ? { triggerType: data.triggerType } : {}),
    ...(data.triggerValue !== undefined ? { triggerValue: data.triggerValue || null } : {}),
    ...(data.replyMessage !== undefined ? { replyMessage: data.replyMessage } : {}),
    ...(data.priority !== undefined ? { priority: data.priority } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  });
}

export async function setAutoReplyRuleActive(ruleId: string, isActive: boolean) {
  const service = await AutoReplyService.create();
  return service.updateAutoReplyRule(ruleId, { isActive });
}

export async function deleteAutoReplyRule(ruleId: string) {
  const service = await AutoReplyService.create();
  await service.deleteAutoReplyRule(ruleId);
  return { ok: true };
}
