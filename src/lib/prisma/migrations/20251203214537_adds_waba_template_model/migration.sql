-- CreateEnum
CREATE TYPE "TemplateLanguage" AS ENUM ('en_US');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');

-- CreateEnum
CREATE TYPE "TemplateApprovalStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'DISABLED');

-- CreateTable
CREATE TABLE "waba_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TemplateApprovalStatus" NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "language" "TemplateLanguage" NOT NULL DEFAULT 'en_US',
    "components" JSONB NOT NULL,
    "wabaAccountId" TEXT NOT NULL,
    "rejectedReason" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waba_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waba_templates_wabaAccountId_idx" ON "waba_templates"("wabaAccountId");

-- CreateIndex
CREATE INDEX "waba_templates_status_idx" ON "waba_templates"("status");

-- CreateIndex
CREATE INDEX "waba_templates_category_idx" ON "waba_templates"("category");

-- AddForeignKey
ALTER TABLE "waba_templates" ADD CONSTRAINT "waba_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
