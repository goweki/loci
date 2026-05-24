/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_subscriptionId_fkey";

-- DropIndex
DROP INDEX "payments_subscriptionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "subscriptionId";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "productId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_productId_key" ON "subscriptions"("productId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
