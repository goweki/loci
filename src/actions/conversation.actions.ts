"use server";

import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ConversationDTO, ConversationService } from "@/services/conversation";
import { ActionResult } from "@/types";

export async function getRecentConversationsAction(): Promise<
  ActionResult<ConversationDTO[]>
> {
  try {
    const conversationService = await ConversationService.create();

    const convos = await conversationService.getRecentConversations();

    return { ok: true, data: convos };
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    return { ok: false, error: errorMessage };
  }
}

export async function getConversationsAction(): Promise<
  ActionResult<ConversationDTO[]>
> {
  try {
    const service = await ConversationService.create();
    const convos = await service.getConversations();

    return { ok: true, data: convos };
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    return { ok: false, error: errorMessage };
  }
}

export async function getConversationWithContactAction(
  contactId: string,
): Promise<ActionResult<ConversationDTO>> {
  try {
    const service = await ConversationService.create();
    const convo = await service.getConversationWithContact(contactId);

    return { ok: true, data: convo };
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    return { ok: false, error: errorMessage };
  }
}
