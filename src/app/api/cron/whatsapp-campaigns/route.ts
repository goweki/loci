import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processDueWhatsAppCampaigns } from "@/services/whatsapp/notification-campaign.service";

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await processDueWhatsAppCampaigns());
  } catch (error) {
    console.error("WhatsApp campaign worker failed", error);
    return NextResponse.json({ error: "WhatsApp campaign processing failed" }, { status: 500 });
  }
}
