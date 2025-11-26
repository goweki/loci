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
