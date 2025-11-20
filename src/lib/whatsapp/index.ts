// lib/whatsapp/index.ts

import { WhatsAppClient, WhatsAppClientEnv } from "./client";
import { z } from "zod";

const EnvSchema = z.object({
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_WABA_ID: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_APP_SECRET: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const props: WhatsAppClientEnv = {
  wabaId: env.WHATSAPP_WABA_ID,
  wabaAccessToken: env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
};

const whatsapp = new WhatsAppClient(props);

export * from "./helper-functions";
export default whatsapp;
