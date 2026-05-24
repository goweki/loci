/*
  Warnings:

  - Made the column `transactionId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "transactionId" SET NOT NULL;
