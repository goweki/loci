"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

export async function countMessagesThisMonthByUserId(userId: string) {
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
  data: Prisma.MessageCreateInput | Prisma.MessageUncheckedCreateInput,
) {
  console.log("saving message:", data);
  return prisma.message.create({
    data,
    include: {
      contact: true,
      phoneNumber: true,
    },
  });
}

export async function getMessagesByContactId(contactId: string) {
  return await prisma.message.findMany({
    where: { contactId },
    orderBy: { timestamp: "asc" },
  });
}
