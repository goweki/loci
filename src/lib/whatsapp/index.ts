"use server";

import { WhatsAppMessage } from "../validations";

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

  async sendWhatsAppMessage(data: WhatsAppMessage): Promise<any> {
    // Common fields
    const { phoneNumberId, to, recipient_type, messaging_product } = data;

    // base payload
    let apiPayload = {
      messaging_product: messaging_product,
      recipient_type: recipient_type,
      to: to,
      type: data.type,
      text: undefined,
      image: undefined,
      document: undefined,
      location: undefined,
    };

    switch (data.type) {
      case "text":
        apiPayload = {
          ...apiPayload,
          text: data.text,
        };
        break;

      case "image":
        apiPayload = {
          ...apiPayload,
          image: data.image,
        };
        break;

      case "document":
        apiPayload = {
          ...apiPayload,
          document: data.document,
        };
        break;

      case "location":
        apiPayload = {
          ...apiPayload,
          location: data.location,
        };
        break;

      default:
        // This should never be reached
        throw new Error(`Unsupported message type: ${data}`);
    }

    const url = `${this.baseUrl}${phoneNumberId}/messages`;
    console.log(`Sending message to ${to} using phone ID ${phoneNumberId}`);
    console.log("Payload:", JSON.stringify(apiPayload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.wabaKey}`,
      },
      body: JSON.stringify(apiPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorDetails = responseData.error || responseData;
      console.error("WhatsApp API Error:", errorDetails);
      throw new Error(
        `WhatsApp API request failed: Status ${
          response.status
        }. Details: ${JSON.stringify(errorDetails)}`
      );
    }

    console.log("Message sent successfully:", responseData);
    responseData.sentMessage =
      apiPayload.text ??
      apiPayload.document ??
      apiPayload.image ??
      apiPayload.location;

    return responseData;
  }
}

const whatsapp = new WhatsAppClient();

export * from "./helper-functions";
export default whatsapp;
