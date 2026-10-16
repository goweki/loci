// app/api/webhooks/whatsapp/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import db from "@/lib/prisma";
import { InboundWebhookPayload } from "@/lib/whatsapp/types";
import { isValidMetaWebhookSignature } from "@/lib/whatsapp/webhook-signature";
import { processWhatsAppWebhookPayload } from "@/services/whatsapp/webhook-processing.service";

// Verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log(`mode-${mode}\n`);

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
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

    const claimed = await db.webhookEvent.updateMany({
      where: {
        id: event.id,
        processed: false,
        OR: [{ processingAt: null }, { processingAt: { lt: new Date(Date.now() - 10 * 60_000) } }],
      },
      data: { processingAt: new Date() },
    });
    if (!claimed.count) return new NextResponse("OK");

    await processWhatsAppWebhookPayload(body);
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date(), error: null, nextRetry: null, processingAt: null },
    });

    return new NextResponse("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    if (eventId) {
      await db.webhookEvent.update({
        where: { id: eventId },
        data: {
          error: error instanceof Error ? error.message.slice(0, 1000) : "Unknown webhook error",
          retryCount: { increment: 1 },
          nextRetry: new Date(Date.now() + 60_000),
          processingAt: null,
        },
      }).catch((updateError) => console.error("Failed to record webhook failure:", updateError));
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
