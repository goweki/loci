"use server";

import prisma from "@/lib/prisma";
import { Prisma, User, UserRole } from "@/lib/prisma/generated";
import { seedUsers } from "@/lib/prisma/seed/seed-users";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { metaSyncService } from "@/lib/whatsapp";
import {
  PhoneNumberWithRelations,
  WabaService,
} from "@/services/waba/waba.service";
import { ActionResult } from "@/types";

/**
 * 🔍 Find a phone number by its ID.
 */
export async function getPhoneNumberByIdAction(
  id: string,
): Promise<ActionResult<PhoneNumberWithRelations | null>> {
  try {
    const wabaService = await WabaService.create();
    const phoneNumber = await wabaService.getPhoneNumberById(id);

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * 🔍 Get all phone numbers allowed to a user
 */
export async function getAllPhoneNumbersAction(): Promise<
  ActionResult<PhoneNumberWithRelations[]>
> {
  try {
    const wabaService = await WabaService.create();
    const phoneNumbers = await wabaService.getPhoneNumbers();

    return {
      ok: true,
      data: phoneNumbers,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

/**
 * create phone number.
 */
export async function createPhoneNumberAction(
  data: Prisma.PhoneNumberUncheckedCreateInput & { wabaId: string },
): Promise<ActionResult<PhoneNumberWithRelations | null>> {
  try {
    const wabaService = await WabaService.create();
    const phoneNumber = await wabaService.createPhoneNumber(data);

    return {
      ok: true,
      data: phoneNumber,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function ensureDefaultPhoneNumberExists() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!phoneNumberId) {
    throw new Error("[MISSING ENV] WHATSAPP_PHONE_NUMBER_ID");
  }

  let adminUser: User | null = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!adminUser) {
    const seededUsers = await seedUsers(prisma);
    adminUser = seededUsers.find(({ role }) => role === UserRole.ADMIN) ?? null;
  }

  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  return metaSyncService.ensurePhoneNumber(phoneNumberId, adminUser);
}
