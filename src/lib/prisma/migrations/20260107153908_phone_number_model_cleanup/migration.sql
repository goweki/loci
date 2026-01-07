/*
  Warnings:

  - You are about to drop the column `phoneNumberId` on the `phone_numbers` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `phone_numbers` table. All the data in the column will be lost.
  - Added the required column `wabaId` to the `phone_numbers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "phone_numbers" DROP CONSTRAINT "phone_numbers_userId_fkey";

-- DropIndex
DROP INDEX "phone_numbers_phoneNumberId_key";

-- AlterTable
ALTER TABLE "phone_numbers" DROP COLUMN "phoneNumberId",
DROP COLUMN "userId",
ADD COLUMN     "wabaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_wabaId_fkey" FOREIGN KEY ("wabaId") REFERENCES "waba_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
