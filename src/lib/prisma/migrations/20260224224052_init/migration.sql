/*
  Warnings:

  - A unique constraint covering the columns `[hashedToken]` on the table `auth_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_hashedToken_key" ON "auth_tokens"("hashedToken");
