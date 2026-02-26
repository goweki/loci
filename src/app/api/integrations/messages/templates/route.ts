import { NextRequest, NextResponse } from "next/server";
import whatsapp from "@/lib/whatsapp";
import { MessageSchema } from "@/lib/validations";
import {
  apiKeyMiddleware,
  type AuthenticatedHandler,
} from "@/lib/auth/api-key";
import { validatePhoneNumberOwnership } from "@/data/phoneNumber";
import { checkMessageLimits } from "@/lib/usage/limits";
import { findOrCreateContact } from "@/data/contact";
import { createMessage } from "@/data/message";
import { MessageType } from "@/lib/prisma/generated";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { SubscriptionStatusEnum } from "@/types";

const postTemplateMessage: AuthenticatedHandler = async (request, apiKey) => {
  try {
    const rawBody = await request.json();
    const parse = MessageSchema.safeParse(rawBody);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parse.error.format() },
        { status: 400 },
      );
    }

    const message = parse.data;
    const user = apiKey.user;

    // 1. Concurrent Security & Limit Checks
    const [subscription, limits] = await Promise.all([
      getSubscriptionStatusByUserId(user.id),
      checkMessageLimits(user.id),
      message.phoneNumberId
        ? validatePhoneNumberOwnership(message.phoneNumberId, user.id)
        : Promise.resolve(),
    ]);

    // 2. Authorization Logic
    if (subscription.status !== SubscriptionStatusEnum.ACTIVE) {
      // Logic: Only allow Templates for non-active users (if that is your intent)
      if (message.type.toUpperCase() !== MessageType.TEMPLATE) {
        return NextResponse.json(
          { error: "Active subscription required for non-template messages" },
          { status: 403 },
        );
      }
    }

    if (!limits.allowed) {
      return NextResponse.json(
        { error: "Usage limit exceeded or billing issue" },
        { status: 403 },
      );
    }

    // 3. Prepare Contact before external call (Ensures DB integrity)
    const contact = await findOrCreateContact(user.id, message.to);

    // 4. Dispatch to Meta (External API)
    const waResponse = await whatsapp.sendMessage(message);

    if ("error" in waResponse) {
      throw new Error(`Meta API Error: ${JSON.stringify(waResponse.error)}`);
    }

    // 5. Async Log to Database (Don't block response if not strictly necessary)
    // We get the ID from messages[0].id in the standard WABA response
    const metaMessageId = waResponse.messages?.[0]?.id;

    await createMessage({
      userId: user.id,
      contactId: contact.id,
      phoneNumberId:
        message.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      waMessageId: metaMessageId,
      type: message.type.toUpperCase() as MessageType,
      content: message, // Usually better to store what you SENT rather than Meta's confirmation
      direction: "OUTBOUND",
      status: "SENT",
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      messageId: metaMessageId,
    });
  } catch (error: any) {
    console.error(`[WABA_DISPATCH_ERROR]: ${error.message}`);

    return NextResponse.json(
      { error: "Failed to dispatch WhatsApp message", details: error.message },
      { status: error.status || 502 },
    );
  }
};

export const POST = apiKeyMiddleware(postTemplateMessage);
