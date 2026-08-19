"use server";

import { getUserByIdAction } from "@/actions/user.actions";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";
import { metaSyncService } from "@/lib/whatsapp";

export async function createWabaTemplateAction(
  data: Prisma.WabaTemplateCreateInput,
) {
  return prisma.wabaTemplate.create({ data });
}

export async function findWabaTemplateByIdAction(id: string) {
  return prisma.wabaTemplate.findUnique({ where: { id } });
}

export async function findWabaTemplatesAction(
  args?: Prisma.WabaTemplateFindManyArgs,
) {
  return prisma.wabaTemplate.findMany(args);
}

export async function updateWabaTemplateAction(
  id: string,
  data: Prisma.WabaTemplateUpdateInput,
) {
  return prisma.wabaTemplate.update({
    where: { id },
    data,
  });
}

export async function deleteWabaTemplateAction(id: string) {
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
  const results = await metaSyncService.syncFromMeta();
  console.log("Meta assets synchronized:", results);
}

export async function _getUserById(userId: string) {
  return getUserByIdAction(userId);
}
