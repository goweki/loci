/*
  Warnings:

  - The `channel` column on the `verification_tokens` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- AlterTable
ALTER TABLE "verification_tokens" DROP COLUMN "channel",
ADD COLUMN     "channel" "NotificationChannel";

-- DropEnum
DROP TYPE "VerificationChannel";
