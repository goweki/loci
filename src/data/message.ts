"use server";

import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function countMessagesThisMonth(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.message.count({
    where: {
      userId,
      direction: "OUTBOUND",
      createdAt: { gte: startOfMonth },
    },
  });
}

export async function createMessage(
  data: Prisma.MessageCreateInput | Prisma.MessageUncheckedCreateInput
) {
  return prisma.message.create({
    data,
    include: {
      contact: true,
      phoneNumber: true,
    },
  });
}
