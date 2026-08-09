// lib/whatsapp/generate-template.ts
"use server";

import { WabaTemplateRepository } from "@/data/repositories/waba-template";
import { TemplateLanguage } from "@/lib/prisma/generated";
import whatsapp from "@/lib/whatsapp";
import {
  componentSchema,
  buttonsComponentSchema,
  bodyComponentSchema,
  footerComponentSchema,
  headerComponentSchema,
  Template as TemplateOptions,
  WabaTemplateCreateResponse,
} from "@/lib/whatsapp/types/waba-template";
import z from "zod";

type Component = z.infer<typeof componentSchema>;
type ButtonsComponent = z.infer<typeof buttonsComponentSchema>;
type BodyComponent = z.infer<typeof bodyComponentSchema>;
type FooterComponent = z.infer<typeof footerComponentSchema>;
type HeaderComponent = z.infer<typeof headerComponentSchema>;

export async function createTemplate(
  data: TemplateOptions & {
    name: string;
    createdById: string;
    language?: TemplateLanguage;
    wabaId?: string;
  }
) {
  const wabaId_ = data.wabaId || process.env.WABA_ID;
  if (!wabaId_) {
    throw new Error("missing wabaId and process.env.WABA_ID");
  }
  const res: WabaTemplateCreateResponse = await whatsapp.createTemplate(data);

  const { id, status, category } = res;

  return WabaTemplateRepository.create({
    id,
    name: data.name,
    status,
    category,
    language: data.language || TemplateLanguage.en_US,
    components: data.components,
    wabaId: wabaId_,
    createdById: data.createdById,
  });
}
