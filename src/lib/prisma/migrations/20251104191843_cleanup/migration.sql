-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('KSH', 'US');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'KSH';
