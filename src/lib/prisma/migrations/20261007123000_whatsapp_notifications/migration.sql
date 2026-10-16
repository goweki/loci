CREATE TYPE "WhatsAppCampaignStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'PARTIAL', 'FAILED', 'CANCELLED');
CREATE TYPE "WhatsAppCampaignRecipientStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

ALTER TABLE "contacts"
ADD COLUMN "whatsappOptInAt" TIMESTAMP(3),
ADD COLUMN "whatsappOptInSource" TEXT,
ADD COLUMN "whatsappOptOutAt" TIMESTAMP(3);

CREATE TABLE "whatsapp_campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en_US',
    "bodyParameters" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "WhatsAppCampaignStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "WhatsAppCampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_campaign_recipients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whatsapp_campaigns_status_scheduledAt_idx" ON "whatsapp_campaigns"("status", "scheduledAt");
CREATE INDEX "whatsapp_campaigns_userId_createdAt_idx" ON "whatsapp_campaigns"("userId", "createdAt" DESC);
CREATE UNIQUE INDEX "whatsapp_campaign_recipients_providerMessageId_key" ON "whatsapp_campaign_recipients"("providerMessageId");
CREATE UNIQUE INDEX "whatsapp_campaign_recipients_campaignId_contactId_key" ON "whatsapp_campaign_recipients"("campaignId", "contactId");
CREATE INDEX "whatsapp_campaign_recipients_campaignId_status_idx" ON "whatsapp_campaign_recipients"("campaignId", "status");

ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "phone_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "waba_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "whatsapp_campaign_recipients" ADD CONSTRAINT "whatsapp_campaign_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "whatsapp_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_campaign_recipients" ADD CONSTRAINT "whatsapp_campaign_recipients_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
