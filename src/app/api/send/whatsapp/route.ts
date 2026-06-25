import { NextRequest, NextResponse } from "next/server";
import whatsapp from "@/lib/whatsapp";
import { MessageSchema } from "@/lib/validations";
import {
  apiKeyMiddleware,
  type AuthenticatedHandler,
} from "@/lib/auth/token-handlers";
import { findOrCreateContact } from "@/data/contact";
import { createMessage, getMessagesByUserId } from "@/data/message";
import { MessageType } from "@/lib/prisma/generated";
import z from "zod";
import { authorizeMessageSend } from "@/lib/auth/authorization";
import { removePlus } from "@/lib/utils/telHandlers";

const postTemplateMessage: AuthenticatedHandler = async (request, apiKey) => {
  try {
    const rawBody = await request.json();
    const parse = MessageSchema.safeParse(rawBody);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.treeifyError(parse.error) },
        { status: 400 },
      );
    }

    const message = parse.data;
    const userId = apiKey.user.id;

    console.log("New Message for sending...", message);

    await authorizeMessageSend(userId, message);

    // Dispatch to Meta (External API)
    const waResponse = await whatsapp.sendMessage(message);

    if ("error" in waResponse) {
      throw new Error(`Meta API Error: ${JSON.stringify(waResponse.error)}`);
    }

    // // Extract receipient contact and messageId from response
    const recipient = waResponse.contacts.map(({ input }) => input)[0];
    const metaMessageId = waResponse.messages[0].id;
    // save contact for db integrity
    const localizedContact = await findOrCreateContact(
      userId,
      removePlus(recipient),
    );

    await createMessage({
      userId: userId,
      contactId: localizedContact.id,
      phoneNumberId:
        message.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      waMessageId: metaMessageId,
      type: message.type.toUpperCase() as MessageType,
      content: message, // better to store what you SENT rather than Meta's confirmation
      direction: "OUTBOUND",
      status: "SENT",
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      messageId: metaMessageId,
    });
  } catch (error: any) {
    console.error(`[WABA_DISPATCH_ERROR]:`, error);

    return NextResponse.json(
      { error: "Failed to dispatch WhatsApp message", details: error.message },
      { status: error.status || 502 },
    );
  }
};

const getMessages: AuthenticatedHandler = async (_request, apiKey) => {
  try {
    const userId = apiKey.user.id;
    const messages = await getMessagesByUserId(userId);

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error(`[FETCH_MESSAGES_ERROR]:`, error);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 },
    );
  }
};

export const POST = apiKeyMiddleware(postTemplateMessage);
export const GET = apiKeyMiddleware(getMessages);
