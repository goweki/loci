/*
  Warnings:

  - The values [KSH,US] on the enum `Currency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Currency_new" AS ENUM ('KES', 'USD');
ALTER TABLE "public"."payments" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "currency" TYPE "Currency_new" USING ("currency"::text::"Currency_new");
ALTER TYPE "Currency" RENAME TO "Currency_old";
ALTER TYPE "Currency_new" RENAME TO "Currency";
DROP TYPE "public"."Currency_old";
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'KES';
COMMIT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'KES';
