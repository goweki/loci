import { NextRequest, NextResponse } from "next/server";

// Assuming these types/utils exist in your project
// import { validateTemplatePayload } from "@/lib/validators/waba";
// import { Message } from "@/lib/validations";
import whatsapp from "@/lib/whatsapp";
import { MessageSchema } from "@/lib/validations";
import { ApiKeyAuth, apiKeyMiddleware } from "@/lib/auth/api-key";
import { validatePhoneNumberOwnership } from "@/data/phoneNumber";
import { checkMessageLimits } from "@/lib/usage/limits";
import { findOrCreateContact } from "@/data/contact";
import { createMessage } from "@/data/message";
import { MessageType } from "@/lib/prisma/generated";

export type AuthenticatedHandler = (
  request: NextRequest,
  apiKey: ApiKeyAuth,
) => Promise<Response | NextResponse> | Response | NextResponse;

/**
 * Handler for sending WABA templates via the Loci API
 */
const postTemplateMessage: AuthenticatedHandler = async (request, apiKey) => {
  try {
    const rawBody = await request.json();

    // Validate the payload
    const body = MessageSchema.safeParse(rawBody);
    if (!body.success) {
      console.error("Error parsing incoming request body:", body);
      return NextResponse.json(
        {
          error: "Invalid request body",
        },
        { status: 400 },
      );
    }
    const message = body.data;
    const { phoneNumberId, to } = message;
    const user = apiKey.user;

    if (phoneNumberId) {
      await validatePhoneNumberOwnership(phoneNumberId, user.id);
    }

    const limitCheck = await checkMessageLimits(user.id);
    if (!limitCheck.allowed) {
      const response_ =
        limitCheck.allowed ||
        NextResponse.json(
          {
            error: "API Usage may have exceeded limit",
          },
          { status: 403 },
        );
      return response_; // Returns the 402 or 403 response directly
    }

    const waResponse = await whatsapp.sendMessage(message);

    if ("error" in waResponse) {
      throw new Error(`Error sending whatsapp message: ${waResponse.error}`);
    } else {
      console.log(`SENT whatsapp message:`, waResponse);
    }

    const contact = await findOrCreateContact(user.id, to);

    await createMessage({
      userId: user.id,
      contactId: contact.id,
      phoneNumberId:
        phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      waMessageId: waResponse.messaging_product,
      type: message.type.toUpperCase() as MessageType,
      content: waResponse.messages,
      direction: "OUTBOUND",
      status: "SENT",
      timestamp: new Date(),
    });

    return NextResponse.json({ data: message });
  } catch (error: any) {
    console.error(`ERROR - Failed sending WabaTemplate: ${error.message}`);

    return NextResponse.json(
      { error: "Failed to dispatch WhatsApp message", details: error.message },
      { status: 502 }, // Bad Gateway (Meta was down or rejected the request)
    );
  }
};

export const POST = apiKeyMiddleware(postTemplateMessage);
