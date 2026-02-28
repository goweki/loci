"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

/**
 * Finds a contact for the given phone number.
 */
export async function findContactByPhoneNumber(phoneNumber: string) {
  return prisma.contact.findFirst({
    where: {
      phoneNumber,
    },
  });
}

/**
 * Finds or creates a contact for the given user and phone number.
 * Updates the contact's lastMessageAt field on existing records.
 */
export async function findOrCreateContact(
  userId: string,
  phoneNumber: string,
  contactName?: string | null
) {
  return prisma.contact.upsert({
    where: {
      userId_phoneNumber: {
        userId,
        phoneNumber,
      },
    },
    create: {
      userId,
      phoneNumber,
      name: contactName || null,
    },
    update: {
      lastMessageAt: new Date(),
    },
  });
}

/**
 * Retrieves all contacts for a user.
 */

export type ContactGetPayload = Prisma.ContactGetPayload<{
  include: {
    messages: true;
    user: true;
  };
}>;

export async function getContactsByUserId(
  userId: string
): Promise<ContactGetPayload[]> {
  return prisma.contact.findMany({
    where: { userId },
    include: {
      messages: true,
      user: true,
    },
    orderBy: { updatedAt: "desc" },
    // orderBy: { lastMessageAt: "desc" },
  });
}

/**
 * Retrieves a single contact by ID and user ID.
 */
export async function getContactById(contactId: string, userId: string) {
  return prisma.contact.findFirst({
    where: { id: contactId, userId },
  });
}

/**
 * Updates a contact’s name or other details.
 */
export async function updateContactName(
  contactId: string,
  userId: string,
  name: string
) {
  return prisma.contact.updateMany({
    where: { id: contactId, userId },
    data: { name },
  });
}

/**
 * Deletes a contact (soft delete if needed).
 */
export async function deleteContact(contactId: string, userId: string) {
  return prisma.contact.deleteMany({
    where: { id: contactId, userId },
  });
}
