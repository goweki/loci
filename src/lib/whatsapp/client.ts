// lib/whatsapp/client.ts

import {
  WhatsAppSendMessageResponse,
  WhatsAppPhoneNumberListResponse,
  WhatsAppPhoneNumberDetailsResponse,
  WhatsAppRequestCodeResponse,
  WhatsAppVerifyCodeResponse,
  WhatsAppTemplateListResponse,
  WhatsAppTemplateCreateResponse,
  WhatsAppTemplateDeleteResponse,
  WhatsAppUploadMediaResponse,
  WhatsAppMediaUrlResponse,
  WhatsAppMediaDownloadResponse,
  WhatsAppSubscribedAppsResponse,
  WhatsAppMarkReadResponse,
  WhatsAppTemplateCreateRequest,
} from "./types";

import { Message } from "../validations";
import { WhatsAppLogger } from "./logger";
import { normalizeWhatsAppError } from "./errors";

export interface WhatsAppClientEnv {
  wabaId: string;
  wabaAccessToken: string;
  verifyToken: string;
  appSecret: string;
  phoneNumberId: string;
}

export class WhatsAppClient {
  private baseUrl = "https://graph.facebook.com/v22.0";
  private logger = new WhatsAppLogger({ maskSecrets: true });

  constructor(private env: WhatsAppClientEnv) {}

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
  ): Promise<WhatsAppMarkReadResponse> {
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
  async getPhoneNumbers(): Promise<WhatsAppPhoneNumberListResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/phone_numbers?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Fetching phone numbers");

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getPhoneNumbers)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async getPhoneNumberDetails(
    phoneNumberId: string
  ): Promise<WhatsAppPhoneNumberDetailsResponse> {
    const url = `${this.baseUrl}/${phoneNumberId}?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Fetching phone number details", { phoneNumberId });

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (phoneDetails)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async requestPhoneVerificationCode(
    phoneNumberId: string
  ): Promise<WhatsAppRequestCodeResponse> {
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
  ): Promise<WhatsAppVerifyCodeResponse> {
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
  async getTemplates(): Promise<WhatsAppTemplateListResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/message_templates?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Fetching templates");

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getTemplates)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async createTemplate(
    template: WhatsAppTemplateCreateRequest
  ): Promise<WhatsAppTemplateCreateResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/message_templates`;

    this.logger.info("Creating template", { name: template.name });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    });

    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (createTemplate)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }

  async deleteTemplate(
    name: string,
    language: string
  ): Promise<WhatsAppTemplateDeleteResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/message_templates`;

    this.logger.info("Deleting template", { name, language });

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.env.wabaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, language }),
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
  ): Promise<WhatsAppUploadMediaResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/media`;
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

  async getMediaUrl(mediaId: string): Promise<WhatsAppMediaUrlResponse> {
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

  async downloadMedia(mediaId: string): Promise<WhatsAppMediaDownloadResponse> {
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
  async subscribeApp(): Promise<WhatsAppSubscribedAppsResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/subscribed_apps`;

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

  async unsubscribeApp(): Promise<WhatsAppSubscribedAppsResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/subscribed_apps`;

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

  async getSubscribedApps(): Promise<WhatsAppSubscribedAppsResponse> {
    const url = `${this.baseUrl}/${this.env.wabaId}/subscribed_apps?access_token=${this.env.wabaAccessToken}`;

    this.logger.info("Fetching subscribed apps");

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      this.logger.error("WhatsApp API Error (getSubscribedApps)", json);
      throw normalizeWhatsAppError(res.status, json);
    }

    return json;
  }
}
