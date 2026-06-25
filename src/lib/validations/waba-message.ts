// lib/validations/message.ts

import { z } from "zod";
import { MessageType } from "../prisma/generated";

const templateMessageSchema = z.object({
  type: z.literal(MessageType.TEMPLATE),
  template: z.object({
    name: z.string(),
    language: z
      .object({
        code: z.string().default("en_US"),
      })
      .default({ code: "en_US" }),
    components: z.array(z.any()).optional(),
  }),
});

const textMessageSchema = z.object({
  type: z.literal(MessageType.TEXT),
  text: z.object({
    body: z.string().min(1),
  }),
});

const imageMessageSchema = z.object({
  type: z.literal(MessageType.IMAGE),
  image: z.object({
    link: z.url(),
    caption: z.string().optional(),
  }),
});

const documentMessageSchema = z.object({
  type: z.literal(MessageType.DOCUMENT),
  document: z.object({
    link: z.url(),
    filename: z.string().optional(),
    caption: z.string().optional(),
  }),
});

const locationMessageSchema = z.object({
  type: z.literal(MessageType.LOCATION),
  location: z.object({
    latitude: z.string(),
    longitude: z.string(),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
});

const audioMessageSchema = z.object({
  type: z.literal(MessageType.AUDIO),
  audio: z.object({
    id: z.string().optional(),
    link: z.url().optional(),
  }),
});

const contactsMessageSchema = z.object({
  type: z.literal(MessageType.CONTACT),
  contacts: z.array(
    z.object({
      phone: z.string(),
      name: z.object({ first_name: z.string() }),
    }),
  ),
});

const videoMessageSchema = z.object({
  type: z.literal(MessageType.VIDEO),
  video: z.object({
    link: z.url(),
    caption: z.string().optional(),
  }),
});

const stickerMessageSchema = z.object({
  type: z.literal("STICKER"),
  sticker: z.object({
    id: z.string().optional(),
    link: z.string().url().optional(),
  }),
});

const interactiveMessageSchema = z.object({
  type: z.literal("INTERACTIVE"),
  interactive: z.object({
    type: z.enum(["list", "button"]),
    body: z.object({ text: z.string() }),
    action: z.object({
      button: z.string().optional(),
      sections: z.array(z.any()).optional(),
    }),
  }),
});

const reactionMessageSchema = z.object({
  type: z.literal("REACTION"),
  reaction: z.object({
    message_id: z.string(),
    emoji: z.string(),
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
  context: z
    .object({
      message_id: z.string().min(1),
    })
    .optional(),
});

// Discriminated union by "type"
export const MessageSchema = z
  .discriminatedUnion("type", [
    textMessageSchema,
    imageMessageSchema,
    documentMessageSchema,
    locationMessageSchema,
    audioMessageSchema,
    contactsMessageSchema,
    videoMessageSchema,
    stickerMessageSchema,
    interactiveMessageSchema,
    reactionMessageSchema,
    templateMessageSchema,
  ])
  .and(baseSchema);

export type Message = z.infer<typeof MessageSchema>;
