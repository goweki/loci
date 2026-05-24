/*
  Warnings:

  - You are about to drop the column `paidAt` on the `Invoice` table. All the data in the column will be lost.
  - The primary key for the `plan_features` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `plans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `planId` on the `subscriptions` table. All the data in the column will be lost.
  - Changed the type of `planId` on the `plan_features` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "plan_features" DROP CONSTRAINT "plan_features_planId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_planId_fkey";

-- DropIndex
DROP INDEX "subscriptions_productId_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "paidAt";

-- AlterTable
ALTER TABLE "plan_features" DROP CONSTRAINT "plan_features_pkey",
DROP COLUMN "planId",
ADD COLUMN     "planId" TEXT NOT NULL,
ADD CONSTRAINT "plan_features_pkey" PRIMARY KEY ("planId", "featureId");

-- AlterTable
ALTER TABLE "plans" DROP CONSTRAINT "plans_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "planId";

-- CreateIndex
CREATE INDEX "subscriptions_userId_productId_idx" ON "subscriptions"("userId", "productId");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_id_fkey" FOREIGN KEY ("id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
