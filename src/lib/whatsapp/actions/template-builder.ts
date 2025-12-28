// import { TemplateLanguage } from "@/lib/prisma/generated";
// import { Template } from "../types/waba-template";

// /**
//  * Helper to build template message parameters for sending
//  */
// export function buildTemplateMessage(
//   templateName: string,
//   languageCode: TemplateLanguage,
//   variables?: {
//     header?: string[];
//     body?: string[];
//     buttons?: string[];
//   }
// ): Template {
//   const components: any[] = [];

//   // Add header parameters
//   if (variables?.header && variables.header.length > 0) {
//     components.push({
//       type: "header",
//       parameters: variables.header.map((value) => ({
//         type: "text",
//         text: value,
//       })),
//     });
//   }

//   // Add body parameters
//   if (variables?.body && variables.body.length > 0) {
//     components.push({
//       type: "body",
//       parameters: variables.body.map((value) => ({
//         type: "text",
//         text: value,
//       })),
//     });
//   }

//   // Add button parameters (for dynamic URLs)
//   if (variables?.buttons && variables.buttons.length > 0) {
//     components.push({
//       type: "button",
//       sub_type: "url",
//       index: 0,
//       parameters: variables.buttons.map((value) => ({
//         type: "text",
//         text: value,
//       })),
//     });
//   }

//   return {
//     name: templateName,
//     language: languageCode,
//     components: components.length > 0 ? components : undefined,
//   };
// }

// /**
//  * Helper to build template with media header
//  */
// export function buildTemplateWithMedia(
//   templateName: string,
//   languageCode: TemplateLanguage,
//   mediaType: "image" | "video" | "document",
//   mediaLink: string,
//   bodyVariables?: string[],
//   filename?: string
// ): Template {
//   const components: any[] = [];

//   // Add media header
//   const mediaParam: any = {
//     type: mediaType,
//   };

//   if (mediaType === "document") {
//     mediaParam[mediaType] = {
//       link: mediaLink,
//       filename: filename || "document.pdf",
//     };
//   } else {
//     mediaParam[mediaType] = {
//       link: mediaLink,
//     };
//   }

//   components.push({
//     type: "header",
//     parameters: [mediaParam],
//   });

//   // Add body parameters
//   if (bodyVariables && bodyVariables.length > 0) {
//     components.push({
//       type: "body",
//       parameters: bodyVariables.map((value) => ({
//         type: "text",
//         text: value,
//       })),
//     });
//   }

//   return {
//     name: templateName,
//     language: languageCode,
//     components,
//   };
// }

// /**
//  * Send a template message via WhatsApp API
//  */
// export async function sendTemplateMessage(
//   phoneNumberId: string,
//   to: string,
//   template: Template
// ) {
//   const wabaToken = process.env.WHATSAPP_ACCESS_TOKEN;

//   const response = await fetch(
//     `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${wabaToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         messaging_product: "whatsapp",
//         to,
//         type: "template",
//         template,
//       }),
//     }
//   );

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error?.message || "Failed to send template");
//   }

//   return response.json();
// }

// /**
//  * Example usage:
//  *
//  * // Simple template without variables
//  * const template1 = buildTemplateMessage("welcome_message", "en_US");
//  *
//  * // Template with variables
//  * const template2 = buildTemplateMessage(
//  *   "order_confirmation",
//  *   "en_US",
//  *   {
//  *     body: ["John", "12345", "$99.99"]
//  *   }
//  * );
//  *
//  * // Template with image header
//  * const template3 = buildTemplateWithMedia(
//  *   "product_promo",
//  *   "en_US",
//  *   "image",
//  *   "https://example.com/image.jpg",
//  *   ["Summer Sale", "50% OFF"]
//  * );
//  *
//  * // Send the template
//  * await sendTemplateMessage("PHONE_NUMBER_ID", "+1234567890", template1);
//  */
