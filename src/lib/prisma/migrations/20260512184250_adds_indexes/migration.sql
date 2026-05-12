-- CreateIndex
CREATE INDEX "contacts_userId_lastMessageAt_idx" ON "contacts"("userId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "messages_contactId_timestamp_idx" ON "messages"("contactId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "messages_userId_direction_status_idx" ON "messages"("userId", "direction", "status");

-- CreateIndex
CREATE INDEX "messages_contactId_direction_status_idx" ON "messages"("contactId", "direction", "status");
