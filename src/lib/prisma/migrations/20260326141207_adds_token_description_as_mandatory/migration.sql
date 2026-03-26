/*
  Warnings:

  - Made the column `description` on table `auth_tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "auth_tokens" ALTER COLUMN "description" SET NOT NULL;
