import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markPaymentFailed, markPaymentSuccessful } from "@/data/payment";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("Missing env.process.PAYSTACK_SECRET_KEY");
    return NextResponse.json(
      { error: "Payment configuration failure. Contact admin" },
      { status: 500 }
    );
  }
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error(
        "Webhook payload authentication failure: Invalid signature"
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // if (event.event === "charge.success") {
    //   const { reference, amount, customer } = event.data;

    //   // TODO: Update your DB here (e.g., mark order as paid)
    //   console.log("✅ Payment successful:", {
    //     reference,
    //     amount,
    //     customer: customer.email,
    //   });
    // }
    if (event.event === "charge.success") {
      await markPaymentSuccessful(event.data.reference);
    } else if (event.event === "charge.failed") {
      await markPaymentFailed(event.data.reference);
    }

    // other events
    if (event.event === "transfer.success") {
      console.log("✅ Transfer successful:", event.data);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
