ALTER TABLE "waba_accounts"
ADD COLUMN "accessTokenEncrypted" TEXT,
ADD COLUMN "tokenUpdatedAt" TIMESTAMP(3);
