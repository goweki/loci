import "server-only";

import z from "zod";

export interface WhatsAppClientEnv {
  wabaId: string;
  wabaAccessToken: string;
  verifyToken: string;
  appSecret: string;
  phoneNumberId: string;
  fbAppId: string;
  fbBusinessId: string;
  apiVersion: string;
}

export const EnvSchema = z.object({
  WHATSAPP_WABA_ID: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_APP_SECRET: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  FACEBOOK_BUSINESS_ID: z.string().min(1),
  NEXT_PUBLIC_FACEBOOK_APP_ID: z.string().min(1),
  WABA_API_VERSION: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

export const env_: WhatsAppClientEnv = {
  wabaId: env.WHATSAPP_WABA_ID,
  wabaAccessToken: env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  appSecret: env.WHATSAPP_APP_SECRET,
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  fbAppId: env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  fbBusinessId: env.FACEBOOK_BUSINESS_ID,
  apiVersion: env.WABA_API_VERSION,
};
