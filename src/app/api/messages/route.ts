// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import whatsapp from "@/lib/whatsapp";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { countMessagesThisMonthByUserId, createMessage } from "@/data/message";
import { validatePhoneNumberOwnership } from "@/data/phoneNumber";
import { MessageSchema } from "@/lib/validations";
import { findOrCreateContact } from "@/data/contact";
import { MessageType } from "@/lib/prisma/generated";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const phoneNumberId = searchParams.get("phoneNumberId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const messages = await db.message.findMany({
    where: {
      userId: session.user.id,
      ...(contactId && { contactId }),
      ...(phoneNumberId && { phoneNumberId }),
    },
    include: {
      contact: true,
      phoneNumber: true,
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const rawBody = await request.json();
  const result = MessageSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
      },
      { status: 400 },
    );
  }

  const body = result.data;
  const { phoneNumberId, to, type } = body;

  if (!phoneNumberId) {
    return new NextResponse("No phoneNumberId provided", { status: 400 });
  }

  // Validate phone number ownership
  const phoneNumber = await validatePhoneNumberOwnership(
    phoneNumberId,
    session.user.id,
  );

  if (!phoneNumber) {
    return new NextResponse("Phone number not found", { status: 404 });
  }

  // Check subscription limits
  let messageLimit = 0;

  const subscriptionStatus = await getSubscriptionStatusByUserId(
    session.user.id,
  );

  if (!subscriptionStatus.plan) {
    if (subscriptionStatus.status === "TRIALING") {
      messageLimit = 10;
    } else
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 402 },
      );
  } else {
    const { plan } = subscriptionStatus;
    messageLimit = plan.maxMessagesPerMonth;
  }

  // check against limit
  const sentMessages = await countMessagesThisMonthByUserId(session.user.id);
  if (sentMessages > messageLimit) {
    return NextResponse.json(
      {
        error: "Message limit exceeded for your current plan.",
        limit: messageLimit,
        used: sentMessages,
      },
      { status: 403 },
    );
  }

  // Send message via WhatsApp API

  try {
    const waResponse = await whatsapp.sendMessage(body);

    if ("error" in waResponse) {
      throw new Error(`Error sending whatsapp message: ${waResponse.error}`);
    }

    const contact = await findOrCreateContact(session.user.id, to);

    // Store message in database
    const message = await createMessage({
      userId: session.user.id,
      contactId: contact.id,
      phoneNumberId: phoneNumber.id,
      waMessageId: waResponse.messaging_product,
      type: body.type.toUpperCase() as MessageType,
      content: waResponse.messages,
      direction: "OUTBOUND",
      status: "SENT",
      timestamp: new Date(),
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Message sending error:", error);
    return new NextResponse("Failed to send message", { status: 500 });
  }
}
