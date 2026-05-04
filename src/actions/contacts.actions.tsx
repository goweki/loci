"use server";

import { Contact } from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ContactsService } from "@/services/contact";
import { ActionResult } from "@/types";

export async function getContactsAction(): Promise<ActionResult<Contact[]>> {
  try {
    const service = await ContactsService.create();
    const contacts = await service.getContacts();

    return { ok: true, data: contacts };
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    return { ok: false, error: errorMessage };
  }
}
