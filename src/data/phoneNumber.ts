"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

/**
 * 🔍 Find a phone number by its ID.
 */
export async function getPhoneNumberById(id: string) {
  return prisma.phoneNumber.findUnique({
    where: { id },
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
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      id: phoneNumberId,
      userId,
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
export async function getPhoneNumbersByUser(userId: string) {
  return prisma.phoneNumber.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * ➕ Create a new phone number record.
 */
export async function createPhoneNumber(
  data: Prisma.PhoneNumberCreateInput | Prisma.PhoneNumberUncheckedCreateInput
) {
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
  return prisma.phoneNumber.count({
    where: {
      userId,
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
