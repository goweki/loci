// lib/payments.ts

import { Paystack } from "paystack-sdk";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  throw new Error("Missing process.env.PAYSTACK_SECRET_KEY");
}

const paystack = new Paystack(PAYSTACK_SECRET_KEY);

/**
 * Initialize a payment
 * @param email Customer email
 * @param amount Amount in Naira (converted internally to kobo)
 * @param reference Optional unique transaction reference
 */
export async function initializePayment(
  email: string,
  amount: number,
  reference?: string
) {
  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: (amount * 100).toString(), // Paystack expects amount in cents
      reference,
      currency: "NGN",
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
    });

    return response.data; // returns { authorization_url, access_code, reference }
  } catch (error: any) {
    console.error("Error initializing payment:", error);
    throw new Error(error.message || "Failed to initialize payment");
  }
}

/**
 * Verify a payment using its reference
 */
export async function verifyPayment(reference: string) {
  try {
    const response = await paystack.transaction.verify(reference);
    return response.data; // payment details (status, metadata, etc.)
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    throw new Error(error.message || "Failed to verify payment");
  }
}

/**
 * List all transactions
 */
export async function listTransactions() {
  try {
    const response = await paystack.transaction.list();
    return response.data; // list of transactions
  } catch (error: any) {
    console.error("Error listing transactions:", error);
    throw new Error(error.message || "Failed to list transactions");
  }
}

/**
 * Refund a payment (optional)
 */
export async function refundPayment(reference: string, amount?: number) {
  try {
    const response = await paystack.refund.create({
      transaction: reference,
      amount: amount ? amount * 100 : undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error refunding payment:", error);
    throw new Error(error.message || "Failed to refund payment");
  }
}
