import { z } from "zod";

export const phoneNumberSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  displayName: z.string().min(1).max(100).optional(),
});
