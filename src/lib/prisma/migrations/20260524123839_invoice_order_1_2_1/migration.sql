/*
  Warnings:

  - You are about to drop the column `invoiceId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_invoiceId_fkey";

-- DropIndex
DROP INDEX "Order_invoiceId_key";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "orderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "invoiceId";

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
