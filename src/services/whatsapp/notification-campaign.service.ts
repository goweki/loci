import "server-only";

import prisma from "@/lib/prisma";
import { MessageDirection, MessageStatus, MessageType, WhatsAppCampaignStatus, WhatsAppCampaignRecipientStatus } from "@/lib/prisma/generated";
import whatsapp from "@/lib/whatsapp";
import { getWhatsAppTokenForPhoneNumber } from "@/lib/whatsapp/credentials";
import { reserveWhatsAppMessage } from "@/services/whatsapp/message-quota.service";

const RECIPIENT_BATCH_SIZE = 20;

export async function processDueWhatsAppCampaigns() {
  const now = new Date();
  await prisma.whatsAppCampaignRecipient.updateMany({
    where: { status: WhatsAppCampaignRecipientStatus.SENDING, updatedAt: { lt: new Date(now.getTime() - 30 * 60_000) } },
    data: { status: WhatsAppCampaignRecipientStatus.FAILED, error: "Send outcome is uncertain after an interrupted worker. Reconcile with Meta before resending." },
  });
  const campaigns = await prisma.whatsAppCampaign.findMany({
    where: {
      OR: [
        { status: WhatsAppCampaignStatus.SCHEDULED, scheduledAt: { lte: now } },
        { status: WhatsAppCampaignStatus.PROCESSING },
      ],
    },
    select: { id: true },
    take: 10,
    orderBy: { scheduledAt: "asc" },
  });
  const summary = { campaigns: 0, sent: 0, failed: 0, pending: 0 };

  for (const item of campaigns) {
    const claim = await prisma.whatsAppCampaign.updateMany({
      where: { id: item.id, status: WhatsAppCampaignStatus.SCHEDULED, scheduledAt: { lte: now } },
      data: { status: WhatsAppCampaignStatus.PROCESSING },
    });
    if (!claim.count) {
      const current = await prisma.whatsAppCampaign.findUnique({ where: { id: item.id }, select: { status: true } });
      if (current?.status !== WhatsAppCampaignStatus.PROCESSING) continue;
    }

    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: item.id },
      include: { template: true, phoneNumber: true, recipients: { where: { status: WhatsAppCampaignRecipientStatus.PENDING }, take: RECIPIENT_BATCH_SIZE, include: { contact: true } } },
    });
    if (!campaign || campaign.status !== WhatsAppCampaignStatus.PROCESSING) continue;
    if (!campaign.template) {
      await prisma.whatsAppCampaign.update({
        where: { id: campaign.id },
        data: { status: WhatsAppCampaignStatus.CANCELLED, completedAt: now },
      });
      continue;
    }
    summary.campaigns += 1;

    for (const recipient of campaign.recipients) {
      const recipientClaim = await prisma.whatsAppCampaignRecipient.updateMany({
        where: { id: recipient.id, status: WhatsAppCampaignRecipientStatus.PENDING },
        data: { status: WhatsAppCampaignRecipientStatus.SENDING, error: null },
      });
      if (!recipientClaim.count) continue;

      if (!recipient.contact.whatsappOptInAt || recipient.contact.whatsappOptOutAt) {
        await prisma.whatsAppCampaignRecipient.update({ where: { id: recipient.id }, data: { status: WhatsAppCampaignRecipientStatus.FAILED, error: "Recipient consent is no longer active." } });
        summary.failed += 1;
        continue;
      }

      try {
        await reserveWhatsAppMessage(campaign.userId);
        const components = campaign.bodyParameters.length
          ? [{ type: "body", parameters: campaign.bodyParameters.map((text) => ({ type: "text", text })) }]
          : undefined;
        const response = await whatsapp.sendTemplate({
          phoneNumberId: campaign.phoneNumberId,
          to: recipient.contact.phoneNumber,
          type: MessageType.TEMPLATE,
          template: { name: campaign.template.name, language: { code: campaign.language }, ...(components ? { components } : {}) },
        }, await getWhatsAppTokenForPhoneNumber(campaign.phoneNumberId));
        if ("error" in response) throw new Error(response.error.message || "WhatsApp template send failed.");
        const providerMessageId = response.messages?.[0]?.id;
        if (!providerMessageId) throw new Error("Meta accepted no message ID for this send.");
        await prisma.$transaction([
          prisma.message.create({
            data: {
              userId: campaign.userId,
              contactId: recipient.contactId,
              phoneNumberId: campaign.phoneNumberId,
              waMessageId: providerMessageId,
              type: MessageType.TEMPLATE,
              content: { templateName: campaign.template.name, language: campaign.language, parameters: campaign.bodyParameters },
              direction: MessageDirection.OUTBOUND,
              status: MessageStatus.SENT,
              timestamp: new Date(),
            },
          }),
          prisma.whatsAppCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: WhatsAppCampaignRecipientStatus.SENT, providerMessageId, sentAt: new Date() },
          }),
          prisma.contact.update({ where: { id: recipient.contactId }, data: { lastMessageAt: new Date() } }),
        ]);
        summary.sent += 1;
      } catch (error) {
        await prisma.whatsAppCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: WhatsAppCampaignRecipientStatus.FAILED, error: error instanceof Error ? error.message.slice(0, 500) : "WhatsApp send failed." },
        });
        summary.failed += 1;
      }
    }

    const counts = await prisma.whatsAppCampaignRecipient.groupBy({ by: ["status"], where: { campaignId: campaign.id }, _count: { _all: true } });
    const countByStatus = Object.fromEntries(counts.map((entry) => [entry.status, entry._count._all]));
    const pending = countByStatus[WhatsAppCampaignRecipientStatus.PENDING] ?? 0;
    const sending = countByStatus[WhatsAppCampaignRecipientStatus.SENDING] ?? 0;
    summary.pending += pending + sending;
    if (pending === 0 && sending === 0) {
      const sent = countByStatus[WhatsAppCampaignRecipientStatus.SENT] ?? 0;
      const failed = countByStatus[WhatsAppCampaignRecipientStatus.FAILED] ?? 0;
      await prisma.whatsAppCampaign.update({
        where: { id: campaign.id },
        data: { status: failed === 0 ? WhatsAppCampaignStatus.SENT : sent === 0 ? WhatsAppCampaignStatus.FAILED : WhatsAppCampaignStatus.PARTIAL, completedAt: new Date() },
      });
    }
  }

  return summary;
}
