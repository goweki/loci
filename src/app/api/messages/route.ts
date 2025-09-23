// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { WhatsAppClient } from "@/lib/whatsapp";

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

  const body = await request.json();
  const { phoneNumberId, to, type, content } = body;

  // Validate phone number ownership
  const phoneNumber = await db.phoneNumber.findFirst({
    where: {
      id: phoneNumberId,
      userId: session.user.id,
      status: "VERIFIED",
    },
  });

  if (!phoneNumber) {
    return new NextResponse("Phone number not found", { status: 404 });
  }

  // Check subscription limits
  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return new NextResponse("Active subscription required", { status: 402 });
  }

  // Send message via WhatsApp API
  const whatsappClient = new WhatsAppClient({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: phoneNumber.phoneNumberId!,
    wabaId: phoneNumber.wabaId!,
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  });

  try {
    let waResponse;
    if (type === "text") {
      waResponse = await whatsappClient.sendTextMessage(to, content.text);
    } else if (type === "image") {
      waResponse = await whatsappClient.sendMediaMessage(
        to,
        "image",
        content.url,
        content.caption
      );
    }
    // Add other message types...

    // Find or create contact
    const contact = await db.contact.upsert({
      where: {
        userId_phoneNumber: {
          userId: session.user.id,
          phoneNumber: to,
        },
      },
      create: {
        userId: session.user.id,
        phoneNumber: to,
        name: content.contactName || null,
      },
      update: {
        lastMessageAt: new Date(),
      },
    });

    // Store message in database
    const message = await db.message.create({
      data: {
        userId: session.user.id,
        contactId: contact.id,
        phoneNumberId: phoneNumber.id,
        waMessageId: waResponse.messages[0].id,
        type,
        content,
        direction: "OUTBOUND",
        status: "SENT",
        timestamp: new Date(),
      },
      include: {
        contact: true,
        phoneNumber: true,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Message sending error:", error);
    return new NextResponse("Failed to send message", { status: 500 });
  }
}
