// waba-template types

import { z } from "zod";
import {
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
} from "@/lib/prisma/generated";

/* ---------- Buttons ---------- */

export const quickReplyButtonSchema = z.object({
  type: z.literal("QUICK_REPLY"),
  text: z.string().min(1).max(25),
});

export const urlButtonSchema = z.object({
  type: z.literal("URL"),
  text: z.string().min(1).max(25),
  url: z.string().url(),
  example: z.array(z.string()).optional(), // for dynamic URL variables
});

export const phoneNumberButtonSchema = z.object({
  type: z.literal("PHONE_NUMBER"),
  text: z.string().min(1).max(25),
  phone_number: z.string().min(1),
});

export const catalogButtonSchema = z.object({
  type: z.literal("CATALOG"),
  text: z.string().min(1).max(25),
});

export const mpmButtonSchema = z.object({
  type: z.literal("MPM"),
  text: z.string().min(1).max(25),
});

export const otpButtonSchema = z.discriminatedUnion("otp_type", [
  z.object({
    type: z.literal("OTP"),
    otp_type: z.literal("COPY_CODE"),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("OTP"),
    otp_type: z.literal("ONE_TAP"),
    text: z.string().min(1),
    autofill_text: z.string().min(1),
    package_name: z.string().min(1),
    signature_hash: z.string().min(1),
  }),
]);

export const nonAuthButtonSchema = z.union([
  quickReplyButtonSchema,
  urlButtonSchema,
  phoneNumberButtonSchema,
  catalogButtonSchema,
  mpmButtonSchema,
]);

export const buttonSchema = z.union([nonAuthButtonSchema, otpButtonSchema]);

/* ---------- Components ---------- */

export const headerComponentSchema = z.object({
  type: z.literal("HEADER"),
  format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "LOCATION"]),
  text: z.string().optional(),
  example: z
    .object({
      header_text: z.array(z.string()).optional(),
      header_handle: z.array(z.string()).optional(),
    })
    .optional(),
});

export const bodyComponentSchema = z.object({
  type: z.literal("BODY"),
  text: z.string().min(1),
  add_security_recommendation: z.boolean().optional(),
  example: z
    .object({
      body_text: z.array(z.array(z.string())).optional(),
    })
    .optional(),
});

export const footerComponentSchema = z.object({
  type: z.literal("FOOTER"),
  text: z.string().max(60).optional(),
  code_expiration_minutes: z.number().min(1).max(90).optional(),
});

export const buttonsComponentSchema = z.object({
  type: z.literal("BUTTONS"),
  buttons: z.array(buttonSchema).max(10),
});

export const componentSchema = z.union([
  headerComponentSchema,
  bodyComponentSchema,
  footerComponentSchema,
  buttonsComponentSchema,
]);

/* ---------- AUTH Template ---------- */

export const authenticationTemplateSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  language: z.enum(TemplateLanguage).default(TemplateLanguage.en_US),
  category: z.literal(TemplateCategory.AUTHENTICATION),
  status: z
    .enum(TemplateApprovalStatus)
    .default(TemplateApprovalStatus.PENDING),
  components: z.array(
    z.union([
      bodyComponentSchema,
      footerComponentSchema,
      buttonsComponentSchema,
    ])
  ),
});

/* ---------- NON-AUTH Template ---------- */

export const nonAuthTemplateSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  language: z.enum(TemplateLanguage).default(TemplateLanguage.en_US),
  category: z.enum([TemplateCategory.UTILITY, TemplateCategory.MARKETING]),
  status: z
    .enum(TemplateApprovalStatus)
    .default(TemplateApprovalStatus.PENDING),
  components: z.array(componentSchema),
});

/* ---------- Convenience Builders (for form data) ---------- */

export const authTemplateBuilderSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  language: z.enum(TemplateLanguage).default(TemplateLanguage.en_US),
  category: z.literal(TemplateCategory.AUTHENTICATION),
  body: z.object({
    text: z.string().min(1),
    addSecurityRecommendation: z.boolean().optional(),
  }),
  footer: z
    .object({
      text: z.string().optional(),
      codeExpirationMinutes: z.number().min(1).max(90).optional(),
    })
    .optional(),
  buttons: z.tuple([otpButtonSchema]),
});

export const nonAuthTemplateBuilderSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  language: z.enum(TemplateLanguage).default(TemplateLanguage.en_US),
  category: z.enum([TemplateCategory.UTILITY, TemplateCategory.MARKETING]),
  body: z.object({
    text: z.string().min(1),
    example: z.array(z.array(z.string())).optional(),
  }),
  header: z
    .object({
      format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "LOCATION"]),
      text: z.string().optional(),
      example: z
        .object({
          header_text: z.array(z.string()).optional(),
          header_handle: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
  footer: z
    .object({
      text: z.string().max(60).optional(),
    })
    .optional(),
  buttons: z.array(nonAuthButtonSchema).max(10).optional(),
});

/* ---------- Union Types ---------- */
export const templateSchema = z.union([
  authenticationTemplateSchema,
  nonAuthTemplateSchema,
]);

export const templateBuilderSchema = z.union([
  authTemplateBuilderSchema,
  nonAuthTemplateBuilderSchema,
]);

export type Template = z.infer<typeof templateSchema>;
export type TemplateBuilder = z.infer<typeof templateBuilderSchema>;

/* ---------- API Responses ---------- */

export const wabaTemplateCreateResponseSchema = z.object({
  id: z.string(),
  status: z.enum(TemplateApprovalStatus),
  category: z.enum(TemplateCategory),
});

export type WabaTemplateCreateResponse = z.infer<
  typeof wabaTemplateCreateResponseSchema
>;

export const wabaTemplateDeleteResponseSchema = z.object({
  success: z.boolean(),
});

export type WabaTemplateDeleteResponse = z.infer<
  typeof wabaTemplateDeleteResponseSchema
>;

export const wabaTemplateGetResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  status: z.enum(TemplateApprovalStatus),
  category: z.enum(TemplateCategory),
  previous_category: z.enum(TemplateCategory).optional(),
  components: z.array(componentSchema),
});

export type WabaTemplateGetResponse = z.infer<
  typeof wabaTemplateGetResponseSchema
>;

export const wabaTemplateListResponseSchema = z.object({
  data: z.array(wabaTemplateGetResponseSchema),
  paging: z
    .object({
      cursors: z.object({
        before: z.string(),
        after: z.string(),
      }),
    })
    .optional(),
});

export type WabaTemplateListResponse = z.infer<
  typeof wabaTemplateListResponseSchema
>;

/* ---------- Helper Functions ---------- */

/**
 * Converts builder format to WhatsApp API format
 */
export function builderToTemplate(builder: TemplateBuilder): Template {
  if (builder.category === TemplateCategory.AUTHENTICATION) {
    const components: any[] = [
      {
        type: "BODY",
        text: builder.body.text,
        ...(builder.body.addSecurityRecommendation && {
          add_security_recommendation: true,
        }),
      },
    ];

    if (builder.footer) {
      components.push({
        type: "FOOTER",
        ...builder.footer,
        ...(builder.footer.codeExpirationMinutes && {
          code_expiration_minutes: builder.footer.codeExpirationMinutes,
        }),
      });
    }

    components.push({
      type: "BUTTONS",
      buttons: builder.buttons,
    });

    return {
      name: builder.name,
      language: builder.language,
      category: builder.category,
      components,
    } as Template;
  } else {
    const components: any[] = [];

    if (builder.header) {
      components.push({
        type: "HEADER",
        format: builder.header.format,
        ...(builder.header.text && { text: builder.header.text }),
        ...(builder.header.example && { example: builder.header.example }),
      });
    }

    components.push({
      type: "BODY",
      text: builder.body.text,
      ...(builder.body.example && {
        example: { body_text: builder.body.example },
      }),
    });

    if (builder.footer?.text) {
      components.push({
        type: "FOOTER",
        text: builder.footer.text,
      });
    }

    if (builder.buttons && builder.buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: builder.buttons,
      });
    }

    return {
      name: builder.name,
      language: builder.language,
      category: builder.category,
      components,
    } as Template;
  }
}
