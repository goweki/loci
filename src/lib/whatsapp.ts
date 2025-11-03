// lib/whatsapp.ts
const WABA_ID = process.env.WABA_ID;
const WABA_KEY = process.env.WABA_KEY;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

class WhatsAppClient {
  private baseUrl = "https://graph.facebook.com/v18.0";
  private wabaId = WABA_ID;
  private wabaKey = WABA_KEY;
  private verifyToken = VERIFY_TOKEN;

  constructor() {}

  /**
   * ✅ Verify incoming webhook challenge from Meta (used in GET /api/webhook).
   */
  verifyWebhook(params: {
    "hub.mode"?: string;
    "hub.verify_token"?: string;
    "hub.challenge"?: string;
  }) {
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    if (mode === "subscribe" && token === this.verifyToken) {
      // Verified successfully
      return { verified: true, challenge };
    }

    // Verification failed
    return { verified: false, challenge: null };
  }

  async sendMessage(
    to: string,
    phoneNumberId: string,
    message: MessagePayload
  ) {
    const response = await fetch(`${this.baseUrl}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.wabaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        ...message,
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return response.json();
  }

  async sendTextMessage(to: string, phoneNumberId: string, text: string) {
    return this.sendMessage(to, phoneNumberId, {
      type: "text",
      text: { body: text },
    });
  }

  async sendMediaMessage(
    to: string,
    phoneNumberId: string,
    type: "image" | "document" | "audio" | "video",
    mediaUrl: string,
    caption?: string
  ) {
    return this.sendMessage(to, phoneNumberId, {
      type,
      [type]: {
        link: mediaUrl,
        caption,
      },
    });
  }

  async sendTemplateMessage(
    to: string,
    phoneNumberId: string,
    templateName: string,
    language: string,
    parameters?: any[]
  ) {
    return this.sendMessage(to, phoneNumberId, {
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: parameters
          ? [
              {
                type: "body",
                parameters,
              },
            ]
          : undefined,
      },
    });
  }
}

interface MessagePayload {
  type: string;
  text?: { body: string };
  image?: { link: string; caption?: string };
  document?: { link: string; caption?: string };
  audio?: { link: string };
  video?: { link: string; caption?: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
}

export const whatsapp = new WhatsAppClient();
