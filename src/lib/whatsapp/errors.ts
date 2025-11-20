// lib/whatsapp/errors.ts

import { WhatsAppAPIError } from "./types";

export class WhatsAppClientError extends Error {
  public status: number;
  public details: WhatsAppAPIError | null;

  constructor(
    message: string,
    status = 500,
    details: WhatsAppAPIError | null = null
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Normalize Meta API error format
export const normalizeWhatsAppError = (
  responseStatus: number,
  raw: any
): WhatsAppClientError => {
  const metaError: WhatsAppAPIError = raw?.error || raw || {};

  const msg =
    metaError.message ||
    `WhatsApp API request failed with HTTP ${responseStatus}`;

  return new WhatsAppClientError(msg, responseStatus, metaError);
};
