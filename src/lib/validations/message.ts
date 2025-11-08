import { z } from "zod";

export const textMessageSchema = z.object({
  type: z.literal("text"),
  text: z.object({
    body: z.string().min(1),
  }),
});

export const imageMessageSchema = z.object({
  type: z.literal("image"),
  image: z.object({
    link: z.string().url(),
    caption: z.string().optional(),
  }),
});

export const documentMessageSchema = z.object({
  type: z.literal("document"),
  document: z.object({
    link: z.string().url(),
    filename: z.string().optional(),
    caption: z.string().optional(),
  }),
});

export const locationMessageSchema = z.object({
  type: z.literal("location"),
  location: z.object({
    latitude: z.string(),
    longitude: z.string(),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
});

const baseSchema = z.object({
  phoneNumberId: z.string().min(5).optional(),
  to: z.string().min(5),
  recipient_type: z
    .enum(["INDIVIDUAL", "GROUP"])
    .default("INDIVIDUAL")
    .optional(),
  messaging_product: z.literal("whatsapp").default("whatsapp").optional(),
});

// Discriminated union by "type"
export const WhatsAppMessageSchema = z
  .discriminatedUnion("type", [
    textMessageSchema,
    imageMessageSchema,
    documentMessageSchema,
    locationMessageSchema,
  ])
  .and(baseSchema);

export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>;
