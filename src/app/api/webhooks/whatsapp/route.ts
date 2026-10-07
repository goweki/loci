// app/api/webhooks/whatsapp/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import db from "@/lib/prisma";
import { processIncomingMessage, processStatusUpdate } from "@/lib/whatsapp/actions";
import { InboundWebhookPayload } from "@/lib/whatsapp/types";
import { env_ } from "@/lib/whatsapp/types/environment-variables";
import { isValidMetaWebhookSignature } from "@/lib/whatsapp/webhook-signature";

// Verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log(`mode-${mode}\n`);

  if (mode === "subscribe" && token === env_.verifyToken) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET;
  const signature = request.headers.get("x-hub-signature-256");
  if (!appSecret) {
    return NextResponse.json({ error: "Webhook signature validation is not configured" }, { status: 500 });
  }
  if (!isValidMetaWebhookSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let eventId: string | undefined;
  try {
    const body = JSON.parse(rawBody) as InboundWebhookPayload;
    const eventKey = createHash("sha256").update(rawBody).digest("hex");

    const event = await db.webhookEvent.upsert({
      where: { eventKey },
      create: {
        eventKey,
        type: "whatsapp_webhook",
        payload: body as object,
      },
      update: {},
    });
    eventId = event.id;
    if (event.processed) return new NextResponse("OK");

    await processWebhookEvent(body);
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date(), error: null },
    });

    return new NextResponse("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    if (eventId) {
      await db.webhookEvent.update({
        where: { id: eventId },
        data: { error: error instanceof Error ? error.message : "Unknown webhook error" },
      }).catch((updateError) => console.error("Failed to record webhook failure:", updateError));
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function processWebhookEvent(body: InboundWebhookPayload) {
  for (const entry of body.entry ?? []) {
    for (const changes of entry.changes ?? []) {
      if (changes.field !== "messages") continue;
      const messages = changes.value?.messages ?? [];
      const contacts = changes.value?.contacts ?? [];
      const metadata = changes.value?.metadata;

      for (const message of messages) {
        if (metadata) await processIncomingMessage(message, contacts, metadata, process.env.META_APP_SECRET!);
      }
      for (const status of changes.value?.statuses ?? []) {
        await processStatusUpdate(status, process.env.META_APP_SECRET!);
      }
    }
  }
}
