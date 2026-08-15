"use server";

import { Prisma } from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
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
