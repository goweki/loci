import "server-only";

import { Currency } from "@/lib/prisma/generated";

const PAYSTACK_API_BASE = "https://api.paystack.co";

export class PaystackApiError extends Error {
  constructor(
    message: string,
    readonly outcomeUnknown: boolean,
  ) {
    super(message);
    this.name = "PaystackApiError";
  }
}

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("Paystack is not configured");
  return secretKey;
}

async function requestPaystack<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new PaystackApiError(
      error instanceof Error ? error.message : "Paystack connection failed",
      init.method !== "GET",
    );
  }

  let body: {
    status?: boolean;
    message?: string;
    data?: T;
  };
  try {
    body = (await response.json()) as typeof body;
  } catch {
    throw new PaystackApiError(
      "Paystack returned an unreadable response",
      init.method !== "GET" && response.status >= 500,
    );
  }

  if (!response.ok || body.status !== true || body.data === undefined) {
    throw new PaystackApiError(
      body.message || `Paystack request failed (${response.status})`,
      init.method !== "GET" && response.status >= 500,
    );
  }

  return body.data;
}

export function toPaystackMinorUnits(
  amount: number,
  currency: Currency,
): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (currency !== Currency.KES && currency !== Currency.USD) {
    throw new Error("Unsupported payment currency");
  }

  const minorUnits = Math.round(amount * 100);
  if (Math.abs(minorUnits / 100 - amount) > 0.000001) {
    throw new Error("Payment amount supports at most two decimal places");
  }

  return minorUnits;
}

export async function initializePaystackTransaction(params: {
  email: string;
  amount: number;
  currency: Currency;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string | number>;
}) {
  const minorUnits = toPaystackMinorUnits(params.amount, params.currency);

  return requestPaystack<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: String(minorUnits),
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return requestPaystack<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    metadata?: unknown;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
}

export async function initiatePaystackTransfer(params: {
  amount: number;
  currency: Currency;
  recipientCode: string;
  reference: string;
  reason: string;
}) {
  return requestPaystack<{
    status: string;
    reference: string;
    transfer_code: string;
  }>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: toPaystackMinorUnits(params.amount, params.currency),
      currency: params.currency,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    }),
  });
}

export async function verifyPaystackTransfer(reference: string) {
  return requestPaystack<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    transfer_code?: string;
  }>(`/transfer/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
}

export async function createPaystackTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
  type: "kepss" | "mobile_money";
  currency: Currency;
}) {
  return requestPaystack<{
    recipient_code: string;
    currency: string;
    active: boolean;
  }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: params.type,
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency,
    }),
  });
}
