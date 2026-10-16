import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InboundWebhookPayload } from "@/lib/whatsapp/types";
import { processWhatsAppWebhookPayload } from "@/services/whatsapp/webhook-processing.service";

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET ?? "";
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  return Boolean(expected && provided && Buffer.byteLength(expected) === Buffer.byteLength(provided) && timingSafeEqual(Buffer.from(expected), Buffer.from(provided)));
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const candidates = await prisma.webhookEvent.findMany({
    where: {
      type: "whatsapp_webhook",
      processed: false,
      retryCount: { lt: 5 },
      nextRetry: { lte: new Date() },
      OR: [{ processingAt: null }, { processingAt: { lt: new Date(Date.now() - 10 * 60_000) } }],
    },
    select: { id: true },
    take: 10,
    orderBy: { createdAt: "asc" },
  });
  let processed = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const claim = await prisma.webhookEvent.updateMany({
      where: { id: candidate.id, processed: false, retryCount: { lt: 5 }, OR: [{ processingAt: null }, { processingAt: { lt: new Date(Date.now() - 10 * 60_000) } }] },
      data: { processingAt: new Date() },
    });
    if (!claim.count) continue;
    const event = await prisma.webhookEvent.findUnique({ where: { id: candidate.id }, select: { payload: true, retryCount: true } });
    if (!event) continue;
    try {
      await processWhatsAppWebhookPayload(event.payload as InboundWebhookPayload);
      await prisma.webhookEvent.update({ where: { id: candidate.id }, data: { processed: true, processedAt: new Date(), processingAt: null, nextRetry: null, error: null } });
      processed += 1;
    } catch (error) {
      const retryCount = event.retryCount + 1;
      const delayMinutes = Math.min(60, 2 ** retryCount);
      await prisma.webhookEvent.update({
        where: { id: candidate.id },
        data: {
          retryCount,
          nextRetry: retryCount < 5 ? new Date(Date.now() + delayMinutes * 60_000) : null,
          processingAt: null,
          error: error instanceof Error ? error.message.slice(0, 1000) : "Unknown webhook processing error",
        },
      });
      failed += 1;
    }
  }
  return NextResponse.json({ processed, failed, selected: candidates.length });
}
