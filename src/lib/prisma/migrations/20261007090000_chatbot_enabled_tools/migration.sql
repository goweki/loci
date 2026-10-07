ALTER TABLE "chatbot_configs"
ADD COLUMN "enabledTools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "chatbot_configs"
ADD COLUMN "profileContext" TEXT;
