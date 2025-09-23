import { z } from "zod";

export const messageSchema = z.object({
  phoneNumberId: z.string().cuid(),
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  type: z.enum(["text", "image", "document", "audio", "video"]),
  content: z.object({
    text: z.string().max(4096).optional(),
    url: z.string().url().optional(),
    caption: z.string().max(1024).optional(),
  }),
});
