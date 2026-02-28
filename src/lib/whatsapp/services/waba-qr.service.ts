// lib/services/waba-qr.service.ts

export class WhatsAppQrService {
  private baseUrl: string;

  constructor(
    private accessToken: string,
    private version: string,
    private phoneNumberId: string
  ) {
    this.baseUrl = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}`;
  }

  // Generic request helper for GET, POST, DELETE
  private async apiRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE",
    body?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    if (params) {
      for (const key in params) {
        if (params[key] != null) url.searchParams.append(key, params[key]);
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WhatsApp API Error ${response.status}: ${err}`);
    }

    return response.json();
  }

  // ---------------------------------------------------------------------
  // 🟢 CREATE QR CODE
  // POST /message_qrdls
  // ---------------------------------------------------------------------
  async createQrCode(prefilledMessage: string, format: "SVG" | "PNG" = "SVG") {
    return this.apiRequest("message_qrdls", "POST", {
      prefilled_message: prefilledMessage,
      generate_qr_image: format,
    });
  }

  // ---------------------------------------------------------------------
  // 🔵 READ — Get list of all QR codes (default fields)
  // GET /message_qrdls
  // ---------------------------------------------------------------------
  async getAllQrCodes() {
    return this.apiRequest("message_qrdls", "GET");
  }

  // ---------------------------------------------------------------------
  // 🔵 READ — Get list with custom fields
  // GET /message_qrdls?fields=...
  // ---------------------------------------------------------------------
  async getAllQrCodesWithFields(fields: string) {
    return this.apiRequest("message_qrdls", "GET", undefined, { fields });
  }

  // ---------------------------------------------------------------------
  // 🔵 READ — Get a single QR code by ID
  // GET /message_qrdls/{code}
  // ---------------------------------------------------------------------
  async getQrCode(codeId: string) {
    return this.apiRequest(`message_qrdls/${codeId}`, "GET");
  }

  // ---------------------------------------------------------------------
  // 🔵 READ — Get the QR image URL (SVG/PNG)
  // GET /message_qrdls?fields=...&code=<ID>
  // ---------------------------------------------------------------------
  async getQrImageUrl(codeId: string, format: "SVG" | "PNG" = "SVG") {
    return this.apiRequest("message_qrdls", "GET", undefined, {
      code: codeId,
      fields: `prefilled_message,deep_link_url,qr_image_url.format(${format})`,
    });
  }

  // ---------------------------------------------------------------------
  // 🟡 UPDATE QR CODE (change its prefilled message)
  // POST /message_qrdls
  // ---------------------------------------------------------------------
  async updateQrCode(codeId: string, newMessage: string) {
    return this.apiRequest("message_qrdls", "POST", {
      code: codeId,
      prefilled_message: newMessage,
    });
  }

  // ---------------------------------------------------------------------
  // 🔴 DELETE QR CODE
  // DELETE /message_qrdls/{code}
  // ---------------------------------------------------------------------
  async deleteQrCode(codeId: string) {
    return this.apiRequest(`message_qrdls/${codeId}`, "DELETE");
  }
}
