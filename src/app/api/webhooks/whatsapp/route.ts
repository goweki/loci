// app/api/webhooks/whatsapp/route.ts

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { processIncomingMessage } from "@/lib/whatsapp";
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json(
      { error: "Verifivcation TOKEN not configured" },
      { status: 500 }
    );
  }

  console.log(`mode-${mode}\n`);

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Store webhook event for processing
    await db.webhookEvent.create({
      data: {
        type: "whatsapp_webhook",
        payload: body,
      },
    });

    // Process webhook in background
    await processWebhookEvent(body);

    return new NextResponse("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function processWebhookEvent(body: any) {
  console.log("processing webhook event:", body);
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];

  if (changes?.field === "messages") {
    const messages = changes.value?.messages || [];
    const contacts = changes.value?.contacts || [];

    for (const message of messages) {
      await processIncomingMessage(message, contacts);
    }
  }
}
