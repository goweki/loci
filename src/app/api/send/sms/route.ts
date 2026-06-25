import { NextRequest, NextResponse } from "next/server";
import { createMessage, getMessagesByUserId } from "@/data/message";
import {
  apiKeyMiddleware,
  type AuthenticatedHandler,
} from "@/lib/auth/token-handlers";
import { MessageStatus, MessageType } from "@/lib/prisma/generated";
import z from "zod";
import sendSms, { getDefaultSmsPhoneNumberId } from "@/lib/sms";
import { findOrCreateContact } from "@/data/contact";
import { removePlus } from "@/lib/utils/telHandlers";
import { authorizeMessageSend } from "@/lib/auth/authorization";
import { Message } from "@/lib/validations";

const SmsSchema = z.object({
  type: z.enum(MessageType),
  to: z.union([z.string(), z.array(z.string())]),
  message: z.string().trim().min(1).max(1600),
  from: z.string().optional(),
});

const postSms: AuthenticatedHandler = async (request, apiKey) => {
  try {
    const body = await request.json();

    const parsed = SmsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const sms = parsed.data;
    const userId = apiKey.user.id;

    console.log("New SMS for sending...", sms);

    const authorizationInput: Message = {
      type: "TEXT",
      to: Array.isArray(sms.to) ? sms.to[0] : sms.to,
      text: {
        body: sms.message,
      },
    };
    await authorizeMessageSend(userId, authorizationInput);

    const response = await sendSms(sms);

    const recipients = Array.isArray(response.recipients)
      ? response.recipients
      : [response.recipients];
    const recipientContacts = recipients
      .filter(({ status }) => status === "fulfilled")
      .map(({ number }) => number);
    // Prepare Contact before storing message
    const localizedContacts = await Promise.all(
      recipientContacts.map((recipient) =>
        findOrCreateContact(userId, removePlus(recipient)),
      ),
    );

    await Promise.all(
      localizedContacts.map(async (contact) => {
        const rec = recipients.find(
          ({ number }) => contact.phoneNumber === removePlus(number),
        );

        if (!rec) {
          console.error(
            `Missing receipient with contact - ${contact.phoneNumber} in`,
            recipientContacts,
          );
          throw new Error(
            `Missing receipient with contact - ${contact.phoneNumber}`,
          );
        }

        const defaultSMSsender = await getDefaultSmsPhoneNumberId();

        createMessage({
          userId,
          contactId: contact.id,
          phoneNumberId: defaultSMSsender.id,
          astMessageId: rec.messageId,
          type: MessageType.TEXT,
          direction: "OUTBOUND",
          status: MessageStatus.SENT,
          timestamp: new Date(),
          content: {
            provider: "AFRICASTALKING",
            to: sms.to,
            message: sms.message,
            sender: sms.from,
            cost: rec.cost,
            recipientStatus: rec.status,
          },
        });
      }),
    );

    return NextResponse.json({
      success: true,
      provider: "AFRICASTALKING",
      message: response.message,
      recipients: response.recipients,
    });
  } catch (error: any) {
    console.error("[SMS_DISPATCH_ERROR]", error);

    return NextResponse.json(
      {
        error: "Failed to send SMS.",
        details: error.message,
      },
      {
        status: error.status ?? 502,
      },
    );
  }
};

const getMessages: AuthenticatedHandler = async (_request, apiKey) => {
  try {
    const messages = await getMessagesByUserId(apiKey.user.id);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error("[FETCH_SMS_ERROR]", error);

    return NextResponse.json(
      {
        error: "Failed to fetch messages.",
        details: error.message,
      },
      {
        status: 500,
      },
    );
  }
};

export const POST = apiKeyMiddleware(postSms);
export const GET = apiKeyMiddleware(getMessages);
