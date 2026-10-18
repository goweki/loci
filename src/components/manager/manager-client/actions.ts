"use server";

import { getUserByIdAction } from "@/actions/user.actions";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";
import { metaSyncService } from "@/lib/whatsapp";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/lib/prisma/generated";
import { z } from "zod";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN)
    throw new Error("You are not allowed to manage WhatsApp templates.");
  return user;
}

export async function createWabaTemplateAction(
  data: Prisma.WabaTemplateCreateInput,
) {
  return prisma.wabaTemplate.create({ data });
}

export async function findWabaTemplateByIdAction(id: string) {
  await requireAdmin();
  return prisma.wabaTemplate.findUnique({ where: { id } });
}

export async function findWabaTemplatesAction(
  args?: Prisma.WabaTemplateFindManyArgs,
) {
  await requireAdmin();
  return prisma.wabaTemplate.findMany(args);
}

export async function updateWabaTemplateAction(
  id: string,
  data: Prisma.WabaTemplateUpdateInput,
) {
  await requireAdmin();
  const update = z
    .object({
      name: z.string().trim().min(1).max(512).optional(),
      category: z.enum(["AUTHENTICATION", "UTILITY", "MARKETING"]).optional(),
      language: z.enum(["en_US", "en_GB", "fr_FR", "sw_KE"]).optional(),
      components: z.any().optional(),
    })
    .parse(data);
  const existing = await prisma.wabaTemplate.findUnique({ where: { id } });
  if (!existing) throw new Error("Template not found.");
  return prisma.wabaTemplate.update({ where: { id }, data: update });
}

export async function deleteWabaTemplateAction(id: string) {
  await requireAdmin();
  return prisma.wabaTemplate.delete({ where: { id } });
}

export async function getWabaTemplateStatsAction(userId: string) {
  const [total, approved, pending, rejected] = await prisma.$transaction([
    prisma.wabaTemplate.count({ where: { createdById: userId } }),
    prisma.wabaTemplate.count({
      where: { createdById: userId, status: "APPROVED" },
    }),
    prisma.wabaTemplate.count({
      where: { createdById: userId, status: "PENDING" },
    }),
    prisma.wabaTemplate.count({
      where: { createdById: userId, status: "REJECTED" },
    }),
  ]);

  return { total, approved, pending, rejected };
}

export async function synchronizeMeta() {
  await requireAdmin();
  const results = await metaSyncService.syncFromMeta();
  console.log("Meta assets synchronized:", results);
  return results;
}

export async function _getUserById(userId: string) {
  await requireAdmin();
  return getUserByIdAction(userId);
}
