import "server-only";

import prisma from "@/lib/prisma";
import { TemplateLanguage } from "@/lib/prisma/generated";
import { decryptWhatsAppToken } from "@/lib/whatsapp/credentials";
import { env_ } from "@/lib/whatsapp/types/environment-variables";
import { WhatsAppClient } from "@/lib/whatsapp/services/client";
import {
  Template,
  WabaTemplateCreateResponse,
} from "@/lib/whatsapp/types/waba-template";

export async function submitWabaTemplate({
  template,
  userId,
  wabaId,
}: {
  template: Template;
  userId: string;
  wabaId: string;
}) {
  const account = await prisma.wabaAccount.findFirst({
    where: { id: wabaId, userId },
    select: { id: true, accessTokenEncrypted: true },
  });
  if (!account)
    throw new Error("WhatsApp Business account not found or access denied.");
  if (!account.accessTokenEncrypted)
    throw new Error(
      "Reconnect your WhatsApp Business account before creating templates.",
    );

  const client = new WhatsAppClient({
    ...env_,
    wabaId: account.id,
    wabaAccessToken: decryptWhatsAppToken(account.accessTokenEncrypted),
  });
  const response: WabaTemplateCreateResponse =
    await client.createTemplate(template);
  return prisma.wabaTemplate.create({
    data: {
      id: response.id,
      name: template.name,
      status: response.status,
      category: response.category,
      language: template.language ?? TemplateLanguage.en_US,
      components: template.components,
      wabaId: account.id,
      createdById: userId,
    },
  });
}
