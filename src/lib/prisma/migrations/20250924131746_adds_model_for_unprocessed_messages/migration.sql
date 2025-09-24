-- CreateTable
CREATE TABLE "public"."MessageUnprocessed" (
    "id" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageUnprocessed_pkey" PRIMARY KEY ("id")
);
