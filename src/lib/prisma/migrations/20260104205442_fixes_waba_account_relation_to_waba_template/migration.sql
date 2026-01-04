-- DropForeignKey
ALTER TABLE "waba_templates" DROP CONSTRAINT "waba_templates_wabaId_fkey";

-- AddForeignKey
ALTER TABLE "waba_templates" ADD CONSTRAINT "waba_templates_wabaId_fkey" FOREIGN KEY ("wabaId") REFERENCES "waba_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
