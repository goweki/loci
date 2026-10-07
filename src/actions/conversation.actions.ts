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

export async function setAssistantHandoffAction(
  contactId: string,
  phoneNumberId: string,
  handedOff: boolean,
) {
  try {
    const service = await ConversationService.create();
    const conversation = await service.setAssistantHandoff(contactId, phoneNumberId, handedOff);
    return { ok: true as const, data: conversation };
  } catch (error) {
    return { ok: false as const, error: getFriendlyErrorMessage(error) };
  }
}

export async function sendConversationTextAction(
  contactId: string,
  phoneNumberId: string,
  text: string,
) {
  try {
    const service = await ConversationService.create();
    const message = await service.sendWhatsAppTextMessage({ contactId, phoneNumberId, text });
    return { ok: true as const, data: message };
  } catch (error) {
    return { ok: false as const, error: getFriendlyErrorMessage(error) };
  }
}
