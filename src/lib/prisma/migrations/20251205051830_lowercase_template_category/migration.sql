/*
  Warnings:

  - The values [MARKETING,UTILITY,AUTHENTICATION] on the enum `TemplateCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TemplateCategory_new" AS ENUM ('authentication', 'utility', 'marketing');
ALTER TABLE "waba_templates" ALTER COLUMN "category" TYPE "TemplateCategory_new" USING ("category"::text::"TemplateCategory_new");
ALTER TYPE "TemplateCategory" RENAME TO "TemplateCategory_old";
ALTER TYPE "TemplateCategory_new" RENAME TO "TemplateCategory";
DROP TYPE "public"."TemplateCategory_old";
COMMIT;
