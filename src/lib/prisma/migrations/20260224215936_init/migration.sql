/*
  Warnings:

  - You are about to drop the column `token` on the `auth_tokens` table. All the data in the column will be lost.
  - Added the required column `hashedToken` to the `auth_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `auth_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('SIGN_IN', 'RESET', 'ONBOARDING');

-- AlterTable
ALTER TABLE "auth_tokens" DROP COLUMN "token",
ADD COLUMN     "hashedToken" TEXT NOT NULL,
ADD COLUMN     "type" "TokenType" NOT NULL;
