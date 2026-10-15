ALTER TABLE "messages" ADD COLUMN "replyToWaMessageId" TEXT;
CREATE UNIQUE INDEX "messages_replyToWaMessageId_key" ON "messages"("replyToWaMessageId");
