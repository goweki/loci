/*
  Warnings:

  - You are about to drop the column `wabaId` on the `phone_numbers` table. All the data in the column will be lost.
  - You are about to drop the column `identifier` on the `verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `wabaAccountId` on the `waba_templates` table. All the data in the column will be lost.
  - The required column `id` was added to the `verification_tokens` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userId` to the `verification_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wabaId` to the `waba_templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- DropForeignKey
ALTER TABLE "phone_numbers" DROP CONSTRAINT "phone_numbers_userId_fkey";

-- DropIndex
DROP INDEX "verification_tokens_identifier_token_key";

-- DropIndex
DROP INDEX "verification_tokens_token_key";

-- DropIndex
DROP INDEX "waba_templates_wabaAccountId_idx";

-- AlterTable
ALTER TABLE "phone_numbers" DROP COLUMN "wabaId";

-- AlterTable
ALTER TABLE "verification_tokens" DROP COLUMN "identifier",
ADD COLUMN     "channel" "VerificationChannel",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "waba_templates" DROP COLUMN "wabaAccountId",
ADD COLUMN     "wabaId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "waba_accounts" (
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waba_accounts_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "waba_accounts_userId_key" ON "waba_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "waba_accounts_businessId_key" ON "waba_accounts"("businessId");

-- CreateIndex
CREATE INDEX "waba_templates_userId_idx" ON "waba_templates"("userId");

-- AddForeignKey
ALTER TABLE "waba_accounts" ADD CONSTRAINT "waba_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waba_templates" ADD CONSTRAINT "waba_templates_wabaId_fkey" FOREIGN KEY ("wabaId") REFERENCES "waba_accounts"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "waba_accounts"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
