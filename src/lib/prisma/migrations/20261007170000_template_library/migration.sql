ALTER TABLE "plans"
ADD COLUMN "maxTemplates" INTEGER NOT NULL DEFAULT 3;

UPDATE "plans" SET "maxTemplates" = 10 WHERE "name" = 'STANDARD';
UPDATE "plans" SET "maxTemplates" = 999 WHERE "name" = 'PREMIUM';

INSERT INTO "features" ("id", "name", "description", "useMetric", "updatedAt")
VALUES ('feature_custom_whatsapp_templates', 'Custom WhatsApp Templates', 'Customize curated template components before submission', 'BOOLEAN', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
  "description" = EXCLUDED."description",
  "useMetric" = EXCLUDED."useMetric",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "plan_features" ("planId", "featureId", "enabled")
SELECT p."id", f."id", (p."name" <> 'BASIC')
FROM "plans" p
CROSS JOIN "features" f
WHERE f."name" = 'Custom WhatsApp Templates'
ON CONFLICT ("planId", "featureId") DO UPDATE SET "enabled" = EXCLUDED."enabled";

CREATE TABLE "template_library_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateCategory" NOT NULL,
    "language" "TemplateLanguage" NOT NULL DEFAULT 'en_US',
    "components" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_library_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "template_library_entries_key_key" ON "template_library_entries"("key");
CREATE INDEX "template_library_entries_isActive_isDefault_idx" ON "template_library_entries"("isActive", "isDefault");
