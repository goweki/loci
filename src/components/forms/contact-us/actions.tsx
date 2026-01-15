"use server";

import { contactUsRepository } from "@/data/repositories/contact-us";
import { z } from "zod";

const nullableToUndefined = (v: unknown) => (v === null ? undefined : v);

const contactSchema = z.object({
  name: z.preprocess(nullableToUndefined, z.string().min(1).optional()),
  email: z.string().email(),
  phone: z.preprocess(nullableToUndefined, z.string().optional()),
  company: z.preprocess(nullableToUndefined, z.string().optional()),
  subject: z.preprocess(nullableToUndefined, z.string().min(1).optional()),
  message: z.string().min(10),
});

export async function submitContactForm(formData: FormData) {
  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  };

  // Validate the form data
  const validation = contactSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: true,
      message: "Please fix the errors below",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    // Save to database
    await contactUsRepository.create({
      email: validation.data.email,
      message: validation.data.message,
      name: validation.data.name || undefined,
      subject: validation.data.subject || undefined,
      phone: validation.data.phone || undefined,
      company: validation.data.company || undefined,
    });

    // Optional: Send email notification here
    // await sendEmailNotification(validation.data);

    return {
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      error: true,
      message: "Something went wrong. Please try again later.",
    };
  }
}
