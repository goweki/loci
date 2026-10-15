ALTER TABLE "webhook_events"
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nextRetry" TIMESTAMP(3),
ADD COLUMN "processingAt" TIMESTAMP(3);

CREATE INDEX "webhook_events_processed_nextRetry_idx" ON "webhook_events"("processed", "nextRetry");
