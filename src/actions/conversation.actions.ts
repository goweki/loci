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
