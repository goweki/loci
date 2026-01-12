export type PaystackEvent =
  | "charge.success"
  | "transfer.success"
  | "transfer.failed"
  | "invoice.payment_failed"
  | "paymentrequest.success"
  | string;

export interface PaystackWebhookPayload {
  event: PaystackEvent;
  data: PaystackTransaction;
}

export interface PaystackTransaction {
  id: number;
  reference: string;
  amount: number; // in kobo
  currency: string;
  status: string;
  gateway_response?: string;
  paid_at?: string;
  created_at?: string;
  channel?: string;
  metadata?: any;
  customer?: {
    id: number;
    email: string;
    customer_code: string;
  };
}

export interface ParsedPaystackEvent {
  event: string;
  reference: string;
  amount: number; // major currency (e.g. KES)
  currency: string;
  status: "success" | "failed" | "pending";
  paidAt?: Date;
  customerEmail?: string;
  raw: unknown; // original payload (for audit/debug)
}
