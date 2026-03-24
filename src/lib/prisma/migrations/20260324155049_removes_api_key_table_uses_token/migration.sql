/*
  Warnings:

  - You are about to drop the column `expires` on the `auth_tokens` table. All the data in the column will be lost.
  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expires_at` to the `auth_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_created_by_id_fkey";

-- AlterTable
ALTER TABLE "auth_tokens" DROP COLUMN "expires",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "api_keys";
