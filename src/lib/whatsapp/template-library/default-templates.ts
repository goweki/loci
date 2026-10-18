import { TemplateCategory, TemplateLanguage } from "@/lib/prisma/generated";
import type { Template } from "@/lib/whatsapp/types/waba-template";

/** Built-in templates available to every subscription tier. */
export const DEFAULT_TEMPLATE_LIBRARY = [
  {
    key: "verification_code",
    name: "Verification code (OTP)",
    description: "Send a one-time verification code with a copy-code button.",
    category: TemplateCategory.AUTHENTICATION,
    language: TemplateLanguage.en_US,
    components: [
      {
        type: "BODY",
        text: "{{1}} is your verification code. For your security, do not share this code.",
        add_security_recommendation: true,
        example: { body_text: [["123456"]] },
      },
      { type: "FOOTER", code_expiration_minutes: 10 },
      {
        type: "BUTTONS",
        buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: "Copy code" }],
      },
    ],
  },
  {
    key: "order_update",
    name: "Order update",
    description:
      "Share an order status and let customers choose a quick reply.",
    category: TemplateCategory.UTILITY,
    language: TemplateLanguage.en_US,
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Order update",
      },
      {
        type: "BODY",
        text: "Hi {{1}}, your order {{2}} is now {{3}}. Reply below if you need help.",
        example: { body_text: [["Alex", "10482", "ready for pickup"]] },
      },
      { type: "FOOTER", text: "Thank you for your order." },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Get help" },
          { type: "QUICK_REPLY", text: "View order" },
        ],
      },
    ],
  },
  {
    key: "appointment_reminder",
    name: "Appointment reminder",
    description:
      "Remind customers of an upcoming appointment and request confirmation.",
    category: TemplateCategory.UTILITY,
    language: TemplateLanguage.en_US,
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}. Please confirm or let us know if you need to reschedule.",
        example: { body_text: [["Alex", "Tuesday, 18 June", "10:30 AM"]] },
      },
      { type: "FOOTER", text: "We look forward to seeing you." },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Confirm" },
          { type: "QUICK_REPLY", text: "Reschedule" },
        ],
      },
    ],
  },
] satisfies Array<{
  key: string;
  name: string;
  description: string;
  category: Template["category"];
  language: Template["language"];
  components: Template["components"];
}>;

export type DefaultTemplateLibraryEntry =
  (typeof DEFAULT_TEMPLATE_LIBRARY)[number];
