"use server";

import { contactUsRepository } from "@/data/repositories/contact-us";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1, "Subject is required").optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function submitContactForm(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    company: formData.get("company") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
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
