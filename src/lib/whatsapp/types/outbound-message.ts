// types/outbound-message.ts

import { z } from "zod";

/* ----------------------------------------------------
 * OUTBOUND: Base
 * ---------------------------------------------------- */
const outboundBaseSchema = z.object({
  to: z.string().min(5),
  messaging_product: z.literal("whatsapp").default("whatsapp"),
  recipient_type: z.enum(["individual"]).default("individual"),
  context: z
    .object({
      message_id: z.string(),
    })
    .optional(),
});

/* ----------------------------------------------------
 * OUTBOUND: Text
 * ---------------------------------------------------- */
const outboundText = z.object({
  type: z.literal("text"),
  text: z.object({ body: z.string() }),
});

/* ----------------------------------------------------
 * OUTBOUND: Image
 * ---------------------------------------------------- */
const outboundImage = z.object({
  type: z.literal("image"),
  image: z.object({
    link: z.string().url(),
    caption: z.string().optional(),
  }),
});

/* ----------------------------------------------------
 * OUTBOUND: Document
 * ---------------------------------------------------- */
const outboundDocument = z.object({
  type: z.literal("document"),
  document: z.object({
    link: z.string().url(),
    filename: z.string().optional(),
    caption: z.string().optional(),
  }),
});

/* ----------------------------------------------------
 * OUTBOUND: Location
 * ---------------------------------------------------- */
const outboundLocation = z.object({
  type: z.literal("location"),
  location: z.object({
    latitude: z.string(),
    longitude: z.string(),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
});

/* ----------------------------------------------------
 * OUTBOUND: Template (ONLY outbound)
 * ---------------------------------------------------- */
const outboundTemplate = z.object({
  type: z.literal("template"),
  template: z.object({
    name: z.string(),
    language: z.object({
      code: z.string(),
    }),
    components: z.array(z.any()).optional(),
  }),
});

/* ----------------------------------------------------
 * FINAL OUTBOUND UNION
 * ---------------------------------------------------- */
export const OutboundMessageSchema = z
  .discriminatedUnion("type", [
    outboundText,
    outboundImage,
    outboundDocument,
    outboundLocation,
    outboundTemplate,
  ])
  .and(outboundBaseSchema);

export type OutboundMessage = z.infer<typeof OutboundMessageSchema>;
