-- AlterTable
ALTER TABLE "waba_accounts" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "messageTemplateNamespace" TEXT,
ADD COLUMN     "timezoneId" TEXT;

-- DropEnum
DROP TYPE "WabaCurrency";
