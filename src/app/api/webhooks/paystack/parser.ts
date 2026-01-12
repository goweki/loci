import { ParsedPaystackEvent, PaystackWebhookPayload } from "./types";

export function parsePaystackWebhook(payload: unknown): ParsedPaystackEvent {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("event" in payload) ||
    !("data" in payload)
  ) {
    throw new Error("Invalid Paystack webhook payload");
  }

  const { event, data } = payload as PaystackWebhookPayload;

  if (!data.reference || typeof data.amount !== "number") {
    throw new Error("Missing required Paystack transaction fields");
  }

  return {
    event,
    reference: data.reference,
    amount: data.amount / 100, // convert from cents
    currency: data.currency,
    status: normalizeStatus(event, data.status),
    paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
    customerEmail: data.customer?.email,
    raw: payload,
  };
}

function normalizeStatus(
  event: string,
  status?: string
): "success" | "failed" | "pending" {
  if (event === "charge.success") return "success";
  if (status === "success") return "success";
  if (status === "failed") return "failed";
  return "pending";
}
