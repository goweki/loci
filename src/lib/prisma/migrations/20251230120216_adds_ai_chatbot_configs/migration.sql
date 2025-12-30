-- CreateTable
CREATE TABLE "chatbot_configs" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fallbackToHuman" BOOLEAN NOT NULL DEFAULT true,
    "humanHandoffKeywords" TEXT[],
    "responseDelay" INTEGER DEFAULT 1000,
    "typingIndicator" BOOLEAN NOT NULL DEFAULT true,
    "conversationHistory" INTEGER NOT NULL DEFAULT 10,
    "resetContextAfter" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_conversations" (
    "id" TEXT NOT NULL,
    "chatbotConfigId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "handedOffToHuman" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_configs_phoneNumberId_key" ON "chatbot_configs"("phoneNumberId");

-- CreateIndex
CREATE INDEX "chatbot_conversations_isActive_idx" ON "chatbot_conversations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_conversations_chatbotConfigId_contactId_key" ON "chatbot_conversations"("chatbotConfigId", "contactId");

-- AddForeignKey
ALTER TABLE "chatbot_configs" ADD CONSTRAINT "chatbot_configs_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "phone_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_chatbotConfigId_fkey" FOREIGN KEY ("chatbotConfigId") REFERENCES "chatbot_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
