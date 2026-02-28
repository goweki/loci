export interface PreVerifiedNumberResponse {
  preverificationId: string;
}

export interface RequestCodeResponse {
  success: boolean;
}

export interface VerifyNumberResponse {
  success: boolean;
}

export interface GetTokenUsingWabaAuthCodeResult {
  success: boolean;
  businessToken?: string;
  error?: string;
}

export interface SendResponseOk {
  messaging_product: "whatsapp";

  contacts: {
    input: string;
    wa_id: string;
  }[];

  messages: {
    id: string;
  }[];
}

export interface SendResponseError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details?: string;
    };
    fbtrace_id?: string;
  };
}

export type SendResponse = SendResponseOk | SendResponseError;
