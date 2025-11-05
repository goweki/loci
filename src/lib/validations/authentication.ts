// lib/validations.ts
import { z } from "zod";

export const loginSchema = z.object({
  username: z.email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(5, { message: "Password must be at least 5 characters" })
    .max(16, { message: "Password must be less than 16 characters" }),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    password: z
      .string()
      .min(5, { message: "Password must be at least 5 characters" })
      .max(16, { message: "Password must be less than 16 characters" }),
    confirmPassword: z.string(),
    verificationMethod: z.enum(["email", "whatsapp"] as const, {
      message: "Verification method must be 'email' or 'whatsapp'",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
