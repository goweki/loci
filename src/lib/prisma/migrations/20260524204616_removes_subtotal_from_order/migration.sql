/*
  Warnings:

  - You are about to drop the column `subtotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "subtotal";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "provider";
