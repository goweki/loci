-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'SPAM');

-- CreateTable
CREATE TABLE "ContactUs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactUs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactUs_email_idx" ON "ContactUs"("email");

-- CreateIndex
CREATE INDEX "ContactUs_status_idx" ON "ContactUs"("status");

-- CreateIndex
CREATE INDEX "ContactUs_createdAt_idx" ON "ContactUs"("createdAt");
