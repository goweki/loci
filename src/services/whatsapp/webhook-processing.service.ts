import "server-only";

import {
  processIncomingMessage,
  processStatusUpdate,
} from "@/lib/whatsapp/actions";
import { InboundWebhookPayload } from "@/lib/whatsapp/types";
import prisma from "@/lib/prisma";
import {
  TemplateApprovalStatus,
  TemplateLanguage,
} from "@/lib/prisma/generated";

const templateStatuses = new Set<string>(Object.values(TemplateApprovalStatus));

export async function processWhatsAppWebhookPayload(
  body: InboundWebhookPayload,
) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("Meta webhook processing is not configured.");
  for (const entry of body.entry ?? []) {
    for (const changes of entry.changes ?? []) {
      if (changes.field === "messages") {
        const messages = changes.value?.messages ?? [];
        const contacts = changes.value?.contacts ?? [];
        const metadata = changes.value?.metadata;
        for (const message of messages) {
          if (metadata) {
            await processIncomingMessage(message, contacts, metadata, secret);
          }
        }
        for (const status of changes.value?.statuses ?? []) {
          await processStatusUpdate(status, secret);
        }
      } else if (changes.field === "message_template_status_update") {
        await processTemplateStatusUpdate(entry.id, changes.value);
      }
    }
  }
}

async function processTemplateStatusUpdate(
  wabaId: string,
  update: InboundWebhookPayload["entry"][number]["changes"][number]["value"],
) {
  const event = update.event?.toUpperCase();
  if (!event || event === "LOCKED") return;
  const status =
    event === "REINSTATED" || event === "UNARCHIVED" ? "APPROVED" : event;
  if (!templateStatuses.has(status)) return;

  // Meta's template ID is distinct from our local cuid. The webhook includes
  // a name and language, which match our per-WABA unique template key.
  const language = update.message_template_language;
  if (
    !update.message_template_name ||
    !language ||
    !Object.values(TemplateLanguage).includes(language as TemplateLanguage)
  ) {
    return;
  }

  await prisma.wabaTemplate.updateMany({
    where: {
      name: update.message_template_name,
      language: language as TemplateLanguage,
      wabaId,
    },
    data: {
      status: status as TemplateApprovalStatus,
      rejectedReason: status === "REJECTED" ? (update.reason ?? "Rejected by Meta") : null,
    },
  });
}
