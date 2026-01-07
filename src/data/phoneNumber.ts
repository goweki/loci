"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";
import { getUserById } from "./user";

export type PhoneNumberGetPayload = Prisma.PhoneNumberGetPayload<{
  include: {
    waba: true;
    messages: true;
  };
}>;

/**
 * 🔍 Find a phone number by its ID.
 */
export async function getPhoneNumberById(
  id: string
): Promise<PhoneNumberGetPayload | null> {
  return prisma.phoneNumber.findUnique({
    where: { id },
    include: {
      waba: true,
      messages: true,
    },
  });
}

/**
 * ✅ Validate that a phone number belongs to the user and is VERIFIED.
 *
 * Use this before sending messages, assigning rules, etc.
 */
export async function validatePhoneNumberOwnership(
  phoneNumberId: string,
  userId: string
) {
  const wabaId = (await getUserById(userId))?.id;
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      id: phoneNumberId,
      wabaId,
      status: "VERIFIED",
    },
  });

  if (!phoneNumber) {
    throw new Error("Phone number not found or not verified.");
  }

  return phoneNumber;
}

/**
 * 🔍 Find a phone number by its actual number.
 */
export async function getPhoneNumberByNumber(phoneNumber: string) {
  return prisma.phoneNumber.findUnique({
    where: { phoneNumber },
  });
}

/**
 * 📦 Get all phone numbers for a given user.
 */
export async function getPhoneNumbersByUser(
  userId: string
): Promise<
  Prisma.PhoneNumberGetPayload<{ include: { messages: true; waba: true } }>[]
> {
  const wabaId = (await getUserById(userId))?.id;
  return prisma.phoneNumber.findMany({
    where: { wabaId },
    orderBy: { createdAt: "desc" },
    include: { messages: true, waba: true },
  });
}

/**
 * 📦 Get all phone numbers
 */
export async function getAllPhoneNumbers(): Promise<
  Prisma.PhoneNumberGetPayload<{ include: { messages: true; waba: true } }>[]
> {
  return prisma.phoneNumber.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    include: { messages: true, waba: true },
  });
}

/**
 * ➕ Create a new phone number record.
 */
export async function createPhoneNumber(
  data: Prisma.PhoneNumberCreateInput | Prisma.PhoneNumberUncheckedCreateInput
): Promise<Prisma.PhoneNumberGetPayload<{}>> {
  return prisma.phoneNumber.create({
    data,
  });
}

/**
 * ✏️ Update an existing phone number.
 */
export async function updatePhoneNumber(
  id: string,
  data: Prisma.PhoneNumberUpdateInput
) {
  return prisma.phoneNumber.update({
    where: { id },
    data,
  });
}

/**
 * 🗑️ Delete a phone number (for example, when a user removes integration).
 */
export async function deletePhoneNumber(id: string) {
  return prisma.phoneNumber.delete({
    where: { id },
  });
}

/**
 * 📊 Count the number of verified phone numbers for a given user.
 */
export async function countVerifiedPhoneNumbers(userId: string) {
  const wabaId = (await getUserById(userId))?.id;
  return prisma.phoneNumber.count({
    where: {
      wabaId,
      status: "VERIFIED",
    },
  });
}

/**
 * ✅ Check if the user is within their plan’s phone number limit.
 *
 * You can call this from your API before creating a new phone number.
 */
export async function checkPhoneNumberLimit(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, cancelDate: null },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("No active subscription found");
  }

  const verifiedCount = await countVerifiedPhoneNumbers(userId);
  const allowed = subscription.plan.maxPhoneNumbers;

  return {
    withinLimit: verifiedCount < allowed,
    used: verifiedCount,
    limit: allowed,
  };
}
