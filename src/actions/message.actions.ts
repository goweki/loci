"use server";

import prisma from "@/lib/prisma";
import { Prisma, SubscriptionStatus } from "@/lib/prisma/generated";
import { getUserSubscription } from "./subscription.actions";

export async function getMessagesByUserId(userId: string, limit = 50) {
  return prisma.message.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
    include: {
      contact: true,
      phoneNumber: true,
    },
  });
}

export async function countMessagesSentByUserId(userId: string) {
  return prisma.message.count({
    where: {
      userId,
      direction: "OUTBOUND",
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
