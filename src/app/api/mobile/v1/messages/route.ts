import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import whatsapp from "@/lib/whatsapp";
import { MessageSchema } from "@/lib/validations";
import { mobileAuth } from "@/lib/auth/mobile-api";
import { authorizeMessageSend } from "@/lib/auth/authorization";
import { removePlus } from "@/lib/utils/telHandlers";
import { findOrCreateContact } from "@/actions/contact";
import { createMessage } from "@/actions/message.actions";
import { ensureDefaultPhoneNumberExists } from "@/actions/phoneNumber.actions";
import { reserveWhatsAppMessage } from "@/services/whatsapp/message-quota.service";
import { MessageType } from "@/lib/prisma/generated";

export const POST = mobileAuth(async (request: NextRequest, auth) => {
  const parsed = MessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body", details: z.treeifyError(parsed.error) }, { status: 400 });
  try {
    const message = parsed.data;
    await authorizeMessageSend(auth.user.id, message);
    await reserveWhatsAppMessage(auth.user.id);
    const response = await whatsapp.sendMessage(message);
    if ("error" in response) throw new Error(JSON.stringify(response.error));
    const recipient = response.contacts[0].input;
    const localizedContact = await findOrCreateContact(auth.user.id, removePlus(recipient));
    const phoneNumberId = message.phoneNumberId || (await ensureDefaultPhoneNumberExists()).id;
    await createMessage({ userId: auth.user.id, contactId: localizedContact.id, phoneNumberId, waMessageId: response.messages[0].id, type: message.type.toUpperCase() as MessageType, content: message, direction: "OUTBOUND", status: "SENT", timestamp: new Date() });
    return NextResponse.json({ success: true, data: { messageId: response.messages[0].id, contactId: localizedContact.id } });
  } catch (error) {
    console.error("[MOBILE_MESSAGE_SEND_ERROR]", error);
    return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 502 });
  }
});

export const GET = mobileAuth(async (request, auth) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
  const where = { userId: auth.user.id, ...(searchParams.get("contactId") ? { contactId: searchParams.get("contactId")! } : {}) };
  const prisma = (await import("@/lib/prisma")).default;
  const [items, total] = await Promise.all([prisma.message.findMany({ where, select: { id: true, contactId: true, phoneNumberId: true, type: true, content: true, direction: true, status: true, timestamp: true }, orderBy: { timestamp: "desc" }, skip: (page - 1) * limit, take: limit }), prisma.message.count({ where })]);
  return NextResponse.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});
