import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { parsePaystackWebhook } from "./parser";
import { markPaymentSuccessful, markPaymentFailed } from "@/data/payment";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("Missing PAYSTACK_SECRET_KEY in environment");
    return NextResponse.json(
      { error: "Payment configuration failure. Contact admin" },
      { status: 500 }
    );
  }

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.warn("Missing Paystack signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Compute HMAC SHA-512 hash of the payload
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    // Use timing-safe comparison to prevent subtle attacks
    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse and validate payload
    const eventRaw: unknown = JSON.parse(rawBody);
    const parsed = parsePaystackWebhook(eventRaw);

    console.log("✅ Parsed Paystack event:", parsed);

    // Handle events
    switch (parsed.event) {
      case "charge.success":
        await markPaymentSuccessful(parsed.reference);
        break;

      case "charge.failed":
        await markPaymentFailed(parsed.reference);
        break;

      case "transfer.success":
        console.log("✅ Transfer successful:", parsed);
        break;

      case "transfer.failed":
        console.warn("⚠️ Transfer failed:", parsed);
        break;

      default:
        console.info("ℹ️ Unhandled Paystack event:", parsed.event);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
