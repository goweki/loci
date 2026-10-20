"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
  UserRole,
} from "@/lib/prisma/generated";
import {
  componentSchema,
  templateSchema,
} from "@/lib/whatsapp/types/waba-template";
import { SubscriptionService } from "@/services/subscription/subscription.service";
import { submitWabaTemplate } from "@/services/waba/template.service";
import { z } from "zod";
import { DEFAULT_TEMPLATE_LIBRARY } from "@/lib/whatsapp/template-library/default-templates";
import { WhatsAppClient } from "@/lib/whatsapp/services/client";
import { decryptWhatsAppToken } from "@/lib/whatsapp/credentials";
import { env_ } from "@/lib/whatsapp/types/environment-variables";

const componentsSchema = z.array(componentSchema).min(1);

const libraryEntrySchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(128)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores."),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  category: z.enum(TemplateCategory),
  language: z.enum(TemplateLanguage),
  components: componentsSchema,
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN)
    throw new Error("Admin access is required.");
  return user;
}

async function getPlanAccess(userId: string) {
  const service = await SubscriptionService.create(userId);
  const subscription = await service.getCurrentSubscription();
  const active = Boolean(
    subscription &&
    subscription.status === "ACTIVE" &&
    subscription.currentPeriodEnd >= new Date(),
  );

  const plan = active ? subscription?.plan : null;
  const canCustomize = Boolean(
    plan?.planFeatures.some(
      (feature) =>
        feature.feature.name === "Custom WhatsApp Templates" && feature.enabled,
    ),
  );
  return { subscription: active ? subscription : null, plan, canCustomize };
}

export async function getTemplateLibraryForUserAction() {
  const actor = await requireUser();
  const [{ subscription, plan, canCustomize }, waba] = await Promise.all([
    getPlanAccess(actor.id),
    prisma.wabaAccount.findFirst({
      where: { userId: actor.id },
      select: { id: true },
    }),
  ]);

  const [entries, templates] = await Promise.all([
    prisma.templateLibraryEntry.findMany({
      where: {
        isActive: true,
        ...(canCustomize ? {} : { isDefault: true }),
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    waba
      ? prisma.wabaTemplate.findMany({
          where: { wabaId: waba.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return {
    entries,
    templates,
    canCustomize,
    hasActiveSubscription: Boolean(subscription),
    currentCount: templates.length,
    maxTemplates: plan?.maxTemplates ?? 0,
  };
}

export async function createTemplateFromLibraryAction(input: unknown) {
  const actor = await requireUser();
  const requestSchema = z.object({
    libraryEntryId: z.string().min(1).optional(),
    staticTemplateKey: z.string().min(1).optional(),
    name: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(/^[a-z0-9_]+$/),
    components: componentsSchema.optional(),
  });
  const request = requestSchema.parse(input);
  if (Boolean(request.libraryEntryId) === Boolean(request.staticTemplateKey)) {
    throw new Error("Choose exactly one template library entry.");
  }
  const [{ subscription, plan, canCustomize }, waba] = await Promise.all([
    getPlanAccess(actor.id),
    prisma.wabaAccount.findFirst({
      where: { userId: actor.id },
      select: { id: true },
    }),
  ]);

  if (!subscription || !plan)
    throw new Error(
      "An active subscription is required to create WhatsApp templates.",
    );
  if (!waba)
    throw new Error(
      "Connect a WhatsApp Business account before creating templates.",
    );

  const staticEntry = request.staticTemplateKey
    ? DEFAULT_TEMPLATE_LIBRARY.find(
        (template) => template.key === request.staticTemplateKey,
      )
    : undefined;
  const entry = staticEntry
    ? staticEntry
    : request.libraryEntryId
      ? await prisma.templateLibraryEntry.findFirst({
          where: {
            id: request.libraryEntryId,
            isActive: true,
            ...(canCustomize ? {} : { isDefault: true }),
          },
        })
      : null;
  if (!entry) throw new Error("This template is not available on your plan.");

  const count = await prisma.wabaTemplate.count({ where: { wabaId: waba.id } });
  if (count >= plan.maxTemplates) {
    throw new Error(
      `Your plan allows ${plan.maxTemplates} WhatsApp templates. Remove a template or upgrade to create another.`,
    );
  }

  if (!canCustomize && request.components) {
    throw new Error("Your plan can use the curated template as provided.");
  }
  const components = request.components ?? entry.components;
  const validated = templateSchema.parse({
    name: request.name,
    language: entry.language,
    category: entry.category,
    status: TemplateApprovalStatus.PENDING,
    components,
  });

  const duplicate = await prisma.wabaTemplate.findFirst({
    where: { wabaId: waba.id, name: validated.name },
    select: { id: true },
  });
  if (duplicate)
    throw new Error(
      "A template with that name already exists for this WhatsApp account.",
    );

  return submitWabaTemplate({
    template: validated,
    userId: actor.id,
    wabaId: waba.id,
  });
}

export async function deleteWabaTemplateAction(templateId: string) {
  const actor = await requireUser();
  const id = z.string().min(1).parse(templateId);
  const template = await prisma.wabaTemplate.findFirst({
    where: { id, waba: { userId: actor.id } },
    include: { waba: { select: { id: true, accessTokenEncrypted: true } } },
  });
  if (!template) throw new Error("Template not found or access denied.");
  if (!template.waba.accessTokenEncrypted) {
    throw new Error("Reconnect your WhatsApp Business account before deleting templates.");
  }

  const client = new WhatsAppClient({
    ...env_,
    wabaId: template.waba.id,
    wabaAccessToken: decryptWhatsAppToken(template.waba.accessTokenEncrypted),
  });
  await client.deleteTemplate(template.name, template.id);
  return prisma.$transaction(async (tx) => {
    await tx.whatsAppCampaign.updateMany({
      where: {
        templateId: template.id,
        status: { in: ["SCHEDULED", "PROCESSING"] },
      },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
        templateId: null,
      },
    });
    return tx.wabaTemplate.delete({ where: { id: template.id } });
  });
}

export async function getTemplateLibraryForManagerAction() {
  await requireAdmin();
  return prisma.templateLibraryEntry.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function createTemplateLibraryEntryAction(input: unknown) {
  await requireAdmin();
  const data = libraryEntrySchema.parse(input);
  templateSchema.parse({
    name: data.key,
    category: data.category,
    language: data.language,
    status: TemplateApprovalStatus.PENDING,
    components: data.components,
  });
  return prisma.templateLibraryEntry.create({ data });
}

export async function updateTemplateLibraryEntryAction(
  id: string,
  input: unknown,
) {
  await requireAdmin();
  const data = libraryEntrySchema.parse(input);
  templateSchema.parse({
    name: data.key,
    category: data.category,
    language: data.language,
    status: TemplateApprovalStatus.PENDING,
    components: data.components,
  });
  return prisma.templateLibraryEntry.update({ where: { id }, data });
}

export async function deleteTemplateLibraryEntryAction(id: string) {
  await requireAdmin();
  await prisma.templateLibraryEntry.delete({ where: { id } });
  return { ok: true };
}
