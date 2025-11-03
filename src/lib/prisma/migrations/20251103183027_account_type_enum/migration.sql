/*
  Warnings:

  - Changed the type of `type` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('oauth', 'oidc', 'email', 'credentials');

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "type",
ADD COLUMN     "type" "AccountType" NOT NULL;
