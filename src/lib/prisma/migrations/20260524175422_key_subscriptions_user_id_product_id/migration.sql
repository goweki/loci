/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "subscriptions_userId_productId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_productId_key" ON "subscriptions"("userId", "productId");
