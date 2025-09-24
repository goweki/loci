-- CreateEnum
CREATE TYPE "public"."TriggerType" AS ENUM ('KEYWORD', 'MESSAGE_TYPE', 'DEFAULT', 'TIME_BASED');

-- CreateTable
CREATE TABLE "public"."AutoReplyRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "public"."TriggerType" NOT NULL,
    "triggerValue" TEXT,
    "replyMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoReplyRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AutoReplyRule" ADD CONSTRAINT "AutoReplyRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
