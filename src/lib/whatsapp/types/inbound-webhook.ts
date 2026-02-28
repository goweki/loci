// types/inbound-webhook.ts

import { z } from "zod";

/* ----------------------------------------------------
 * INBOUND: Core Message Base Fields
 * ---------------------------------------------------- */
const inboundBase = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
});

/* ----------------------------------------------------
 * INBOUND: Message Types
 * ---------------------------------------------------- */
const inboundText = inboundBase.extend({
  type: z.literal("text"),
  text: z.object({ body: z.string() }),
});

const inboundImage = inboundBase.extend({
  type: z.literal("image"),
  image: z.object({
    id: z.string().optional(),
    caption: z.string().optional(),
  }),
});

const inboundDocument = inboundBase.extend({
  type: z.literal("document"),
  document: z.object({
    id: z.string().optional(),
    filename: z.string().optional(),
    caption: z.string().optional(),
  }),
});

const inboundLocation = inboundBase.extend({
  type: z.literal("location"),
  location: z.object({
    latitude: z.string(),
    longitude: z.string(),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
});

const inboundAudio = inboundBase.extend({
  type: z.literal("audio"),
  audio: z.object({
    id: z.string().optional(),
  }),
});

const inboundVideo = inboundBase.extend({
  type: z.literal("video"),
  video: z.object({
    id: z.string().optional(),
    caption: z.string().optional(),
  }),
});

const inboundSticker = inboundBase.extend({
  type: z.literal("sticker"),
  sticker: z.object({
    id: z.string().optional(),
  }),
});

const inboundReaction = inboundBase.extend({
  type: z.literal("reaction"),
  reaction: z.object({
    message_id: z.string(),
    emoji: z.string(),
  }),
});

const inboundInteractive = inboundBase.extend({
  type: z.literal("interactive"),
  interactive: z.object({
    type: z.enum(["button_reply", "list_reply"]),
    button_reply: z
      .object({
        id: z.string(),
        title: z.string(),
      })
      .optional(),
    list_reply: z
      .object({
        id: z.string(),
        title: z.string(),
      })
      .optional(),
  }),
});

/* ----------------------------------------------------
 * INBOUND: Message Union
 * ---------------------------------------------------- */
export const InboundMessageSchema = z.discriminatedUnion("type", [
  inboundText,
  inboundImage,
  inboundDocument,
  inboundLocation,
  inboundAudio,
  inboundVideo,
  inboundSticker,
  inboundInteractive,
  inboundReaction,
]);

export type InboundMessage = z.infer<typeof InboundMessageSchema>;

/* ----------------------------------------------------
 * INBOUND: Entry Wrapper (Webhook Event)
 * ---------------------------------------------------- */
export const InboundWebhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messaging_product: z.literal("whatsapp"),

            messages: z.array(InboundMessageSchema).optional(),
            statuses: z.array(z.any()).optional(),

            contacts: z.array(z.any()).optional(),
            metadata: z.any().optional(),
            errors: z.array(z.any()).optional(),
          }),
        })
      ),
    })
  ),
});

export type InboundWebhookPayload = z.infer<typeof InboundWebhookPayloadSchema>;

// /* ----------------------------------------------------
//  * INBOUND: Core Message Base Fields
//  * ---------------------------------------------------- */
// const inboundBase = z.object({
//   id: z.string(), // always present
//   from: z.string(), // always present (sender)
//   timestamp: z.string(), // always present
// });

// /* ----------------------------------------------------
//  * INBOUND: Message Types
//  * ---------------------------------------------------- */
// const inboundText = inboundBase.extend({
//   type: z.literal("text"),
//   text: z.object({ body: z.string() }),
// });

// const inboundImage = inboundBase.extend({
//   type: z.literal("image"),
//   image: z.object({
//     id: z.string().optional(),
//     caption: z.string().optional(),
//   }),
// });

// const inboundDocument = inboundBase.extend({
//   type: z.literal("document"),
//   document: z.object({
//     id: z.string().optional(),
//     filename: z.string().optional(),
//     caption: z.string().optional(),
//   }),
// });

// const inboundLocation = inboundBase.extend({
//   type: z.literal("location"),
//   location: z.object({
//     latitude: z.string(),
//     longitude: z.string(),
//     name: z.string().optional(),
//     address: z.string().optional(),
//   }),
// });

// const inboundAudio = inboundBase.extend({
//   type: z.literal("audio"),
//   audio: z.object({
//     id: z.string().optional(),
//   }),
// });

// const inboundVideo = inboundBase.extend({
//   type: z.literal("video"),
//   video: z.object({
//     id: z.string().optional(),
//     caption: z.string().optional(),
//   }),
// });

// const inboundSticker = inboundBase.extend({
//   type: z.literal("sticker"),
//   sticker: z.object({
//     id: z.string().optional(),
//   }),
// });

// const inboundReaction = inboundBase.extend({
//   type: z.literal("reaction"),
//   reaction: z.object({
//     message_id: z.string(),
//     emoji: z.string(),
//   }),
// });

// const inboundInteractive = inboundBase.extend({
//   type: z.literal("interactive"),
//   interactive: z.object({
//     type: z.enum(["button_reply", "list_reply"]),
//     button_reply: z
//       .object({
//         id: z.string(),
//         title: z.string(),
//       })
//       .optional(),
//     list_reply: z
//       .object({
//         id: z.string(),
//         title: z.string(),
//       })
//       .optional(),
//   }),
// });

// /* ----------------------------------------------------
//  * INBOUND: Message Union
//  * ---------------------------------------------------- */
// export const InboundMessageSchema = z.discriminatedUnion("type", [
//   inboundText,
//   inboundImage,
//   inboundDocument,
//   inboundLocation,
//   inboundAudio,
//   inboundVideo,
//   inboundSticker,
//   inboundInteractive,
//   inboundReaction,
// ]);

// export type InboundMessage = z.infer<typeof InboundMessageSchema>;
