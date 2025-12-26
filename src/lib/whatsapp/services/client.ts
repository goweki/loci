// lib/whatsapp/client.ts

import {
  WhatsAppSendMessageResponse,
  WabaPhoneNumberListResponse,
  WabaPhoneNumberDetailsResponse,
  WabaRequestCodeResponse,
  WabaVerifyCodeResponse,
  WabaUploadMediaResponse,
  WabaMediaUrlResponse,
  WabaMediaDownloadResponse,
  WabaSubscribedAppsResponse,
  WabaMarkReadResponse,
} from "../types";

import {
  WabaTemplateCreateResponse,
  WabaTemplateDeleteResponse,
} from "../types/waba-template";

import { Message } from "../../validations";
import { WhatsAppLogger } from "../logger";
import { normalizeWhatsAppError } from "../errors";
import {
  GetTokenUsingWabaAuthCodeResult,
  PreVerifiedNumberResponse,
  RequestCodeResponse,
  VerifyNumberResponse,
} from "../types/waba-api-reponses";
import {
  createPreVerifiedNumber as _createPreVerifiedNumber,
  requestVerificationCode as _requestVerificationCode,
  verifyPreVerifiedNumber as _verifyPreVerifiedNumber,
  getTokenUsingWabaAuthCode as _getTokenUsingWabaAuthCode,
} from "../actions";
import type { WhatsAppClientEnv } from "../types/environment-variables";
import { Prisma } from "@/lib/prisma/generated";
import { Template as TemplateOptions } from "../types/waba-template";

export class WhatsAppClient {
  private logger = new WhatsAppLogger({ maskSecrets: true });
  private baseUrl: string;

  constructor(private env: WhatsAppClientEnv) {
    this.baseUrl = `https://graph.facebook.com/${env.apiVersion}`;
  }

  // ---------------------------------------------------------------------
  // 1. WEBHOOK VERIFICATION
  // ---------------------------------------------------------------------
  verifyWebhook(params: {
    "hub.mode"?: string;
    "hub.verify_token"?: string;
    "hub.challenge"?: string;
  }) {
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    this.logger.info("Webhook verification attempt", params);

    if (mode === "subscribe" && token === this.env.verifyToken) {
      this.logger.info("Webhook verified successfully");
      return { verified: true, challenge };
    }

    this.logger.warn("Webhook verification failed");
    return { verified: false, challenge: null };
  }

  // ---------------------------------------------------------------------
  // 2. SEND MESSAGE
  // ---------------------------------------------------------------------
  async sendMessage(input: Message) {
    const { phoneNumberId, to, type } = input;

    const finalPhoneNumberId =
      phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;

    const url = `${this.baseUrl}/${finalPhoneNumberId}/messages`;

    this.logger.info("Sending WhatsApp message", {
      to,
      type,
      phoneNumberId: finalPhoneNumberId,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (sendMessage)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    this.logger.info("Message sent successfully", json);

    return json;
  }

  // ---------------------------------------------------------------------
  // 3. MARK MESSAGE AS READ
  // ---------------------------------------------------------------------
  async markMessageAsRead(
    messageId: string,
    phoneNumberId: string
  ): Promise<WabaMarkReadResponse> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };

    this.logger.info("Marking message as read", { messageId });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (markRead)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  // ---------------------------------------------------------------------
  // 4. PHONE NUMBERS
  // ---------------------------------------------------------------------
  async getPhoneNumbers(): Promise<WabaPhoneNumberListResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/phone_numbers`;

    this.logger.info("Fetching phone numbers");

    const headers = {
      Authorization: `Bearer ${this.env.wabaAccessToken}`,
    };

    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getPhoneNumbers)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async getPhoneNumberDetails(
    phoneNumberId: string
  ): Promise<WabaPhoneNumberDetailsResponse> {
    const url = `${this.baseUrl}/${phoneNumberId}`;

    this.logger.info("Fetching phone number details", { phoneNumberId });

    const headers = {
      Authorization: `Bearer ${this.env.wabaAccessToken}`,
    };

    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (phoneDetails)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async requestPhoneVerificationCode(
    phoneNumberId: string
  ): Promise<WabaRequestCodeResponse> {
    const url = `${this.baseUrl}/${phoneNumberId}/request_code`;

    this.logger.info("Requesting phone verification code");

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.env.wabaAccessToken}` },
      body: JSON.stringify({ code_method: "SMS" }),
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (requestVerification)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async verifyPhoneCode(
    phoneNumberId: string,
    code: string
  ): Promise<WabaVerifyCodeResponse> {
    const url = `${this.baseUrl}/${phoneNumberId}/verify_code`;

    this.logger.info("Verifying phone number code");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (verifyCode)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  // ---------------------------------------------------------------------
  // 5. TEMPLATE MANAGEMENT
  // ---------------------------------------------------------------------
  async getTemplates(): Promise<(TemplateOptions & { id: string })[]> {
    const url = `${this.baseUrl}/${this.env.fbAppId}/message_templates?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Fetching templates");

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getTemplates)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json.data;
  }

  async getTemplateByName(name: string): Promise<TemplateOptions> {
    const url = `${this.baseUrl}/${this.env.wabaId}/message_templates?name=${name}`;

    this.logger.info(`Fetching template - ${name}`);

    const headers = {
      Authorization: `Bearer ${this.env.wabaAccessToken}`,
    };

    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getTemplates)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json.data;
  }

  async createTemplate(
    template: TemplateOptions
  ): Promise<WabaTemplateCreateResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/message_templates`;

    this.logger.info("Creating template", { name: template.name });

    const _res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    });

    const json = await _res.json();

    if (!_res.ok) {
      this.logger.error("WhatsApp API Error (createTemplate)", json);
      throw normalizeWhatsAppError(_res.status, json);
    }

    return json;
  }

  async deleteTemplate(name: string): Promise<WabaTemplateDeleteResponse> {
    const url = `${this.baseUrl}/${this.env.fbAppId}/message_templates?name=${name}`;

    this.logger.info(`Deleting template - ${name}`);

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (deleteTemplate)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  // ---------------------------------------------------------------------
  // 6. MEDIA MANAGEMENT
  // ---------------------------------------------------------------------
  async uploadMedia(
    file: Buffer,
    mimeType: string
  ): Promise<WabaUploadMediaResponse> {
    const url = `${this.baseUrl}/${this.env.fbAppId}/media`;
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(file)], { type: mimeType }),
      "upload.bin"
    );
    form.append("type", mimeType);

    this.logger.info("Uploading media");

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.env.wabaAccessToken}` },
      body: form,
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (uploadMedia)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async getMediaUrl(mediaId: string): Promise<WabaMediaUrlResponse> {
    const url = `${this.baseUrl}/${mediaId}?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Getting media URL", { mediaId });

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getMediaUrl)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async downloadMedia(mediaId: string): Promise<WabaMediaDownloadResponse> {
    const url = `${this.baseUrl}/${mediaId}/media?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Downloading media", { mediaId });

    const res = await fetch(url);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      this.logger.error("WhatsApp API Error (downloadMedia)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return res.arrayBuffer();
  }

  // ---------------------------------------------------------------------
  // 7. WEBHOOK SUBSCRIPTION MANAGEMENT
  // ---------------------------------------------------------------------
  async subscribeApp(): Promise<WabaSubscribedAppsResponse> {
    const url = `${this.baseUrl}/${this.env.fbAppId}/subscribed_apps`;

    this.logger.info("Subscribing app to WABA");

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.env.wabaAccessToken}` },
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (subscribeApp)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async unsubscribeApp(): Promise<WabaSubscribedAppsResponse> {
    const url = `${this.baseUrl}/${this.env.fbAppId}/subscribed_apps`;

    this.logger.info("Unsubscribing app from WABA");

    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.env.wabaAccessToken}` },
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (unsubscribeApp)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async getSubscribedApps(): Promise<WabaSubscribedAppsResponse> {
    const url = `${this.baseUrl}/${this.env.fbAppId}/subscribed_apps?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Fetching subscribed apps");

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getSubscribedApps)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  // ---------------------------------------------------------------------
  // 8. NUMBER PREVERIFICATION
  // ---------------------------------------------------------------------
  /**
   * Create a pre-verified business phone number in your portfolio
   */
  async createPreVerifiedNumber(
    phoneNumber: string
  ): Promise<PreVerifiedNumberResponse> {
    return _createPreVerifiedNumber(phoneNumber);
  }

  /**
   * Request a verification code (OTP) for a pre-verified number
   */
  async requestVerificationCode(
    preVerifiedNumberId: string
  ): Promise<RequestCodeResponse> {
    return _requestVerificationCode(this.baseUrl, preVerifiedNumberId);
  }

  /**
   * Verify a pre-verified number using the otp
   */
  async verifyPreVerifiedNumber(
    preVerifiedNumberId: string,
    otpCode: string
  ): Promise<VerifyNumberResponse> {
    return _verifyPreVerifiedNumber(
      this.baseUrl,
      preVerifiedNumberId,
      otpCode,
      this.env.wabaAccessToken
    );
  }

  async getTokenUsingWabaAuthCode(
    code: string
  ): Promise<GetTokenUsingWabaAuthCodeResult> {
    return _getTokenUsingWabaAuthCode(
      this.baseUrl,
      code,
      this.env.fbAppId,
      this.env.appSecret
    );
  }
}
