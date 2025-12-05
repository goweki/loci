/*
  Warnings:

  - You are about to drop the column `userId` on the `waba_templates` table. All the data in the column will be lost.
  - You are about to drop the `AutoReplyRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AutoReplyRule" DROP CONSTRAINT "AutoReplyRule_userId_fkey";

-- DropForeignKey
ALTER TABLE "waba_templates" DROP CONSTRAINT "waba_templates_userId_fkey";

-- DropIndex
DROP INDEX "waba_templates_userId_idx";

-- AlterTable
ALTER TABLE "waba_templates" DROP COLUMN "userId";

-- DropTable
DROP TABLE "AutoReplyRule";

-- CreateTable
CREATE TABLE "autoreply_rules" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "triggerValue" TEXT,
    "replyMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "autoreply_rules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "autoreply_rules" ADD CONSTRAINT "autoreply_rules_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "phone_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoreply_rules" ADD CONSTRAINT "autoreply_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
