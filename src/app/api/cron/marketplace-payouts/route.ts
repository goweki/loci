import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { MarketplacePaymentService } from "@/services/commerce/marketplace-payment.service";

const marketplacePayments = new MarketplacePaymentService();

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (
    !cronSecret ||
    !suppliedSecret ||
    Buffer.byteLength(cronSecret) !== Buffer.byteLength(suppliedSecret) ||
    !timingSafeEqual(Buffer.from(cronSecret), Buffer.from(suppliedSecret))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await marketplacePayments.processQueuedPayouts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Marketplace payout worker failed", error);
    return NextResponse.json(
      { error: "Marketplace payout processing failed" },
      { status: 500 },
    );
  }
}
