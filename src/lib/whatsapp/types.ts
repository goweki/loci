// lib/whatsapp/types.ts

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
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: WhatsAppAPIError;

  sentMessage?: any; // your custom injection
}

// ------------------------------
// PHONE NUMBERS
// ------------------------------
export interface WhatsAppPhoneNumber {
  verified_name: string;
  display_phone_number: string;
  id: string;
}

export interface WhatsAppPhoneNumberListResponse {
  data: WhatsAppPhoneNumber[];
}

export interface WhatsAppPhoneNumberDetailsResponse {
  verified_name: string;
  display_phone_number: string;
  quality_rating?: string;
  code_verification_status?: string;
}

// ------------------------------
// PHONE NUMBER VERIFICATION
// ------------------------------
export interface WhatsAppRequestCodeResponse {
  success: boolean;
}

export interface WhatsAppVerifyCodeResponse {
  success: boolean;
}

// ------------------------------
// MESSAGE READ RECEIPTS
// ------------------------------
export interface WhatsAppMarkReadResponse {
  success?: boolean;
  error?: WhatsAppAPIError;
}

// ------------------------------
// TEMPLATES
// ------------------------------
export interface WhatsAppTemplate {
  name: string;
  language: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  category: string;
  components: any[];
}

export interface WhatsAppTemplateListResponse {
  data: WhatsAppTemplate[];
}

export interface WhatsAppTemplateCreateResponse {
  success?: boolean;
  id?: string;
  error?: WhatsAppAPIError;
}

export interface WhatsAppTemplateDeleteResponse {
  success?: boolean;
  error?: WhatsAppAPIError;
}

// ------------------------------
// MEDIA
// ------------------------------
export interface WhatsAppUploadMediaResponse {
  id: string;
}

export interface WhatsAppMediaUrlResponse {
  url: string;
  mime_type: string;
}

export type WhatsAppMediaDownloadResponse = ArrayBuffer;

// ------------------------------
// SUBSCRIPTIONS
// ------------------------------
export interface WhatsAppSubscribedAppsResponse {
  data: Array<{
    id: string;
    name: string;
  }>;
}

export interface WhatsAppTemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  text?: string;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface WhatsAppTemplateCreateRequest {
  name: string;
  language: string; // e.g. "en_US"
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: WhatsAppTemplateComponent[];
}
