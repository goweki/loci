// lib/whatsapp.ts

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  verifyToken: string;
}

export class WhatsAppClient {
  private config: WhatsAppConfig;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(to: string, message: MessagePayload) {
    const response = await fetch(
      `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          ...message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return response.json();
  }

  async sendTextMessage(to: string, text: string) {
    return this.sendMessage(to, {
      type: "text",
      text: { body: text },
    });
  }

  async sendMediaMessage(
    to: string,
    type: "image" | "document" | "audio" | "video",
    mediaUrl: string,
    caption?: string
  ) {
    return this.sendMessage(to, {
      type,
      [type]: {
        link: mediaUrl,
        caption,
      },
    });
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    parameters?: any[]
  ) {
    return this.sendMessage(to, {
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
