import "server-only";

import { processIncomingMessage, processStatusUpdate } from "@/lib/whatsapp/actions";
import { InboundWebhookPayload } from "@/lib/whatsapp/types";

export async function processWhatsAppWebhookPayload(body: InboundWebhookPayload) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("Meta webhook processing is not configured.");
  for (const entry of body.entry ?? []) {
    for (const changes of entry.changes ?? []) {
      if (changes.field !== "messages") continue;
      const messages = changes.value?.messages ?? [];
      const contacts = changes.value?.contacts ?? [];
      const metadata = changes.value?.metadata;
      for (const message of messages) {
        if (metadata) await processIncomingMessage(message, contacts, metadata, secret);
      }
      for (const status of changes.value?.statuses ?? []) {
        await processStatusUpdate(status, secret);
      }
    }
  }
}
