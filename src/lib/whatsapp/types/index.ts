// lib/whatsapp/types.ts

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
export interface WabaPhoneNumber {
  verified_name: string;
  display_phone_number: string;
  id: string;
}

export interface WabaPhoneNumberListResponse {
  data: WabaPhoneNumber[];
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
