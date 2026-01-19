"use server";

import { BASE_URL } from "../utils/getUrl";
import paystack from "./client";

/**
 * Initialize a payment
 * @param email Customer email
 * @param amount Amount in Naira (converted internally to kobo)
 * @param reference Optional unique transaction reference
 */
export async function initializePayment(
  email: string,
  amount: number,
  reference?: string,
) {
  if (!email) {
    throw new Error("No email provided");
  }

  const callback_url = `${BASE_URL}/en/settings/billing`;

  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: (amount * 100).toString(),
      reference,
      callback_url,
    });

    console.log("paystack response:", response);
    return response.data;
  } catch (error: any) {
    console.error("Error initializing payment:", error);
    console.error(JSON.stringify(error));
    return null;
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
