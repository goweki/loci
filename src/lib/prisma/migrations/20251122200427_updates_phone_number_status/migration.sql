/*
  Warnings:

  - The values [PENDING,FAILED] on the enum `PhoneNumberStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PhoneNumberStatus_new" AS ENUM ('VERIFIED', 'NOT_VERIFIED', 'EXPIRED');
ALTER TABLE "public"."phone_numbers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "phone_numbers" ALTER COLUMN "status" TYPE "PhoneNumberStatus_new" USING ("status"::text::"PhoneNumberStatus_new");
ALTER TYPE "PhoneNumberStatus" RENAME TO "PhoneNumberStatus_old";
ALTER TYPE "PhoneNumberStatus_new" RENAME TO "PhoneNumberStatus";
DROP TYPE "public"."PhoneNumberStatus_old";
ALTER TABLE "phone_numbers" ALTER COLUMN "status" SET DEFAULT 'NOT_VERIFIED';
COMMIT;

-- AlterTable
ALTER TABLE "phone_numbers" ALTER COLUMN "status" SET DEFAULT 'NOT_VERIFIED';
