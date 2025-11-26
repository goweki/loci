/*
  Warnings:

  - Added the required column `preVerificationId` to the `phone_numbers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "phone_numbers" ADD COLUMN     "preVerificationId" TEXT NOT NULL;
