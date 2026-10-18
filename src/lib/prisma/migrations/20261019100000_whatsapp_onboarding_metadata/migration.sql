ALTER TABLE "waba_accounts"
ADD COLUMN "accessTokenType" TEXT,
ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "businessId" TEXT;

ALTER TABLE "phone_numbers"
ADD COLUMN "whatsappRegistrationStatus" TEXT;

ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'PAUSED';
ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'IN_APPEAL';
ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'PENDING_DELETION';
ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'DELETED';
ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'LIMIT_EXCEEDED';
ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'ARCHIVED';
ALTER TYPE "TemplateApprovalStatus" ADD VALUE 'FLAGGED';
