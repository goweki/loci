ALTER TABLE "whatsapp_campaigns"
  DROP CONSTRAINT "whatsapp_campaigns_templateId_fkey";

ALTER TABLE "whatsapp_campaigns"
  ALTER COLUMN "templateId" DROP NOT NULL;

ALTER TABLE "whatsapp_campaigns"
  ADD CONSTRAINT "whatsapp_campaigns_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "waba_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
