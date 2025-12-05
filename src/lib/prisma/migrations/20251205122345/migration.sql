/*
  Warnings:

  - Added the required column `createdById` to the `waba_templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "phone_numbers" DROP CONSTRAINT "phone_numbers_userId_fkey";

-- DropForeignKey
ALTER TABLE "waba_templates" DROP CONSTRAINT "waba_templates_wabaId_fkey";

-- AlterTable
ALTER TABLE "waba_templates" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "waba_templates" ADD CONSTRAINT "waba_templates_wabaId_fkey" FOREIGN KEY ("wabaId") REFERENCES "waba_accounts"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waba_templates" ADD CONSTRAINT "waba_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "waba_accounts"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
