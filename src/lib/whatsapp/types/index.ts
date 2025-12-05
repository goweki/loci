// lib/whatsapp/types.ts

import {
  TemplateApprovalStatus,
  TemplateCategory,
} from "@/lib/prisma/generated";

export * from "./inbound-webhook";
export * from "./outbound-message";

// ------------------------------
// COMMON API ERROR FORMAT
// ------------------------------
export interface WhatsAppAPIError {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

// ------------------------------
// SEND MESSAGE
// ------------------------------
export interface WhatsAppSendMessageResponse {
  messaging_product: "whatsapp";
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: WhatsAppAPIError;

  // Custom injection (optional)
  sentMessage?: any;
}

// ------------------------------
// PHONE NUMBERS
// ------------------------------
export interface WabaPhoneBumber {
  verified_name: string;
  display_phone_number: string;
  id: string;
}

export interface WabaPhoneNumberListResponse {
  data: WabaPhoneBumber[];
}

export interface WabaPhoneNumberDetailsResponse {
  verified_name: string;
  display_phone_number: string;
  quality_rating?: string;
  code_verification_status?: string;
}

// ------------------------------
// PHONE NUMBER VERIFICATION
// ------------------------------
export interface WabaRequestCodeResponse {
  success: boolean;
}

export interface WabaVerifyCodeResponse {
  success: boolean;
}

// ------------------------------
// MESSAGE READ RECEIPTS
// ------------------------------
export interface WabaMarkReadResponse {
  success?: boolean;
  error?: WhatsAppAPIError;
}

// ------------------------------
// TEMPLATES
// ------------------------------
export type WabaTemplateComponentButtonType =
  | "QUICK_REPLY"
  | "URL"
  | "PHONE_NUMBER";

export interface WabaTemplateComponentButton {
  type: WabaTemplateComponentButtonType;
  text: string;
  url?: string;
  phone_number?: string;
}

export type WabaTemplateComponentType =
  | "HEADER"
  | "BODY"
  | "FOOTER"
  | "BUTTONS";

export type WabaTemplateComponentFormat =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT";

export interface WabaTemplateComponent {
  type: WabaTemplateComponentType;
  text?: string;
  format?: WabaTemplateComponentFormat;
  buttons?: WabaTemplateComponentButton[];
}

export interface WabaTemplate {
  name: string;
  category: TemplateCategory;
  language: {
    code: string; // e.g. "en_US"
  };
  status: TemplateApprovalStatus;
  components: WabaTemplateComponent[];
}

export interface WabaTemplateCreateRequest {
  name: string;
  language: string; // e.g. "en_US"
  category: TemplateCategory;
  components: WabaTemplateComponent[];
}

export interface WabaTemplateCreateResponse {
  id: string;
  status: TemplateApprovalStatus;
  category: TemplateCategory;
}

export interface WabaTemplateDeleteResponse {
  success: boolean;
}

// ------------------------------
// MEDIA
// ------------------------------
export interface WabaUploadMediaResponse {
  id: string;
}

export interface WabaMediaUrlResponse {
  url: string;
  mime_type: string;
}

export type WabaMediaDownloadResponse = ArrayBuffer;

// ------------------------------
// SUBSCRIPTIONS
// ------------------------------
export interface WabaSubscribedAppsResponse {
  data: Array<{ id: string; name: string }>;
}
