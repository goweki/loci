CREATE TABLE "message_quotas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "message_quotas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_quotas_userId_periodStart_key" ON "message_quotas"("userId", "periodStart");
CREATE INDEX "message_quotas_periodEnd_idx" ON "message_quotas"("periodEnd");
ALTER TABLE "message_quotas" ADD CONSTRAINT "message_quotas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
