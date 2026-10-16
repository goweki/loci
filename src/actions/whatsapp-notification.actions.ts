"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SubscriptionStatus, WhatsAppCampaignStatus } from "@/lib/prisma/generated";
import { z } from "zod";

export async function getWhatsAppNotificationSetup(phoneNumberId?: string) {
  const user = await requireUser();
  const phoneNumbers = await prisma.phoneNumber.findMany({
    where: { status: "VERIFIED", waba: { userId: user.id } },
    select: { id: true, phoneNumber: true, displayName: true, wabaId: true },
    orderBy: { createdAt: "asc" },
  });
  const selectedId = phoneNumbers.some((number) => number.id === phoneNumberId)
    ? phoneNumberId!
    : phoneNumbers[0]?.id;
  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: SubscriptionStatus.ACTIVE, currentPeriodStart: { lte: new Date() }, currentPeriodEnd: { gt: new Date() } },
    select: { currentPeriodStart: true, plan: { select: { maxMessagesPerMonth: true } } },
    orderBy: { currentPeriodEnd: "desc" },
  });
  const quotaUsed = subscription
    ? await prisma.messageQuota.findUnique({ where: { userId_periodStart: { userId: user.id, periodStart: subscription.currentPeriodStart } }, select: { used: true } })
    : null;
  const quota = subscription ? { used: quotaUsed?.used ?? 0, limit: subscription.plan.maxMessagesPerMonth } : null;
  if (!selectedId) return { phoneNumbers, templates: [], contacts: [], campaigns: [], quota };
  const selected = phoneNumbers.find((number) => number.id === selectedId)!;
  const [templates, contacts, campaigns] = await Promise.all([
    prisma.wabaTemplate.findMany({
      where: { wabaId: selected.wabaId ?? "", status: "APPROVED" },
      select: { id: true, name: true, language: true, category: true, components: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { userId: user.id, messages: { some: { phoneNumberId: selectedId } } },
      select: { id: true, name: true, phoneNumber: true, whatsappOptInAt: true, whatsappOptInSource: true, whatsappOptOutAt: true },
      orderBy: { lastMessageAt: "desc" },
      take: 500,
    }),
    prisma.whatsAppCampaign.findMany({
      where: { userId: user.id, phoneNumberId: selectedId },
      select: { id: true, name: true, status: true, scheduledAt: true, completedAt: true, _count: { select: { recipients: true } }, recipients: { select: { status: true, error: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  return {
    phoneNumbers,
    selectedId,
    quota,
    templates,
    contacts,
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      sentCount: campaign.recipients.filter((recipient) => recipient.status === "SENT").length,
      failed: campaign.recipients.filter((recipient) => recipient.status === "FAILED").map((recipient) => recipient.error).filter(Boolean),
    })),
  };
}

const consentSchema = z.object({
  contactId: z.string().min(1),
  optedIn: z.boolean(),
  source: z.string().trim().min(3).max(200).optional(),
});

export async function setWhatsAppConsent(input: unknown) {
  const user = await requireUser();
  const data = consentSchema.parse(input);
  const contact = await prisma.contact.findFirst({ where: { id: data.contactId, userId: user.id }, select: { id: true } });
  if (!contact) throw new Error("Contact not found or access denied.");
  if (data.optedIn && !data.source) throw new Error("Record how the customer gave consent before opting in.");
  return prisma.contact.update({
    where: { id: contact.id },
    data: data.optedIn
      ? { whatsappOptInAt: new Date(), whatsappOptInSource: data.source, whatsappOptOutAt: null }
      : { whatsappOptOutAt: new Date() },
    select: { id: true, whatsappOptInAt: true, whatsappOptOutAt: true },
  });
}

const campaignSchema = z.object({
  phoneNumberId: z.string().min(1),
  templateId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  contactIds: z.array(z.string().min(1)).min(1).max(500),
  bodyParameters: z.array(z.string().max(1024)).max(20).default([]),
  scheduledAt: z.coerce.date(),
});

function bodyVariableCount(components: unknown) {
  if (!Array.isArray(components)) return 0;
  const body = components.find((item) => item && typeof item === "object" && "type" in item && item.type === "BODY") as { text?: unknown } | undefined;
  if (typeof body?.text !== "string") return 0;
  const variables = [...body.text.matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
  return variables.length ? Math.max(...variables) : 0;
}

export async function createWhatsAppCampaign(input: unknown) {
  const user = await requireUser();
  const data = campaignSchema.parse(input);
  const subscription = await prisma.subscription.findFirst({ where: { userId: user.id, status: SubscriptionStatus.ACTIVE, currentPeriodEnd: { gt: new Date() } }, select: { id: true } });
  if (!subscription) throw new Error("An active subscription is required to schedule WhatsApp notifications.");
  if (data.scheduledAt.getTime() < Date.now() - 60_000 || data.scheduledAt.getTime() > Date.now() + 90 * 24 * 60 * 60 * 1000) {
    throw new Error("Choose a send time between now and 90 days from now.");
  }
  const [phoneNumber, template] = await Promise.all([
    prisma.phoneNumber.findFirst({ where: { id: data.phoneNumberId, status: "VERIFIED", waba: { userId: user.id } }, select: { id: true, wabaId: true } }),
    prisma.wabaTemplate.findFirst({ where: { id: data.templateId, status: "APPROVED" } }),
  ]);
  if (!phoneNumber || !phoneNumber.wabaId) throw new Error("WhatsApp number not found or access denied.");
  if (!template || template.wabaId !== phoneNumber.wabaId) throw new Error("Choose an approved template for this WhatsApp account.");
  const requiredVariables = bodyVariableCount(template.components);
  if (Array.isArray(template.components)) {
    const unsupportedDynamicParts = template.components.some((part) => {
      if (!part || typeof part !== "object" || !("type" in part)) return false;
      const component = part as { type?: unknown; text?: unknown; format?: unknown; buttons?: Array<{ url?: unknown }> };
      if (component.type === "HEADER" && component.format !== "TEXT") return true;
      if (component.type !== "BODY" && typeof component.text === "string" && /\{\{\d+\}\}/.test(component.text)) return true;
      if (component.type === "BUTTONS" && component.buttons?.some((button) => typeof button.url === "string" && /\{\{\d+\}\}/.test(button.url))) return true;
      return false;
    });
    if (unsupportedDynamicParts) throw new Error("This notification flow supports body text variables only. Choose a template without dynamic header or button values.");
  }
  if (requiredVariables !== data.bodyParameters.length) {
    throw new Error(`This template requires ${requiredVariables} body value(s).`);
  }
  const contactIds = [...new Set(data.contactIds)];
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      userId: user.id,
      whatsappOptInAt: { not: null },
      whatsappOptOutAt: null,
      messages: { some: { phoneNumberId: phoneNumber.id } },
    },
    select: { id: true },
  });
  if (contacts.length !== contactIds.length) {
    throw new Error("Every recipient must be an owned contact with recorded WhatsApp consent and a conversation on this number.");
  }
  return prisma.whatsAppCampaign.create({
    data: {
      userId: user.id,
      phoneNumberId: phoneNumber.id,
      templateId: template.id,
      name: data.name,
      language: template.language,
      bodyParameters: data.bodyParameters,
      scheduledAt: data.scheduledAt,
      status: WhatsAppCampaignStatus.SCHEDULED,
      recipients: { create: contacts.map((contact) => ({ contactId: contact.id })) },
    },
    select: { id: true, name: true, scheduledAt: true, status: true },
  });
}

export async function cancelWhatsAppCampaign(campaignId: string) {
  const user = await requireUser();
  const result = await prisma.whatsAppCampaign.updateMany({
    where: { id: campaignId, userId: user.id, status: WhatsAppCampaignStatus.SCHEDULED },
    data: { status: WhatsAppCampaignStatus.CANCELLED },
  });
  if (!result.count) throw new Error("Campaign is not found or is already processing.");
  return { ok: true };
}
