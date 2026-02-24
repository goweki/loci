/*
  Warnings:

  - A unique constraint covering the columns `[type,userId]` on the table `auth_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "auth_tokens_type_hashedToken_idx" ON "auth_tokens"("type", "hashedToken");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_type_userId_key" ON "auth_tokens"("type", "userId");
