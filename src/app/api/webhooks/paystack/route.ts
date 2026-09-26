import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  verifyPaystackTransaction,
  verifyPaystackTransfer,
} from "@/lib/payments/paystack-api";
import { MarketplacePaymentService } from "@/services/commerce/marketplace-payment.service";

const marketplacePayments = new MarketplacePaymentService();

type PaystackEventBody = {
  event?: unknown;
  data?: {
    id?: unknown;
    reference?: unknown;
    transfer_code?: unknown;
  };
};

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Payment service is not configured" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!/^[a-f0-9]{128}$/i.test(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const expectedSignature = createHmac("sha512", secret)
    .update(rawBody)
    .digest();
  const receivedSignature = Buffer.from(signature, "hex");
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let eventBody: PaystackEventBody;
  try {
    eventBody = JSON.parse(rawBody) as PaystackEventBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid event payload" },
      { status: 400 },
    );
  }

  if (
    typeof eventBody.event !== "string" ||
    !eventBody.data ||
    typeof eventBody.data !== "object"
  ) {
    return NextResponse.json(
      { error: "Invalid event payload" },
      { status: 400 },
    );
  }

  const eventType = eventBody.event;
  const reference =
    typeof eventBody.data.reference === "string"
      ? eventBody.data.reference
      : undefined;
  const eventId =
    typeof eventBody.data.id === "string" ||
    typeof eventBody.data.id === "number"
      ? String(eventBody.data.id)
      : reference || createHash("sha256").update(rawBody).digest("hex");
  const eventKey = `${eventType}:${eventId}`;

  let eventRecord;
  try {
    eventRecord = await prisma.webhookEvent.create({
      data: {
        eventKey,
        type: eventType,
        payload: {
          event: eventType,
          data: {
            ...(typeof eventBody.data.id === "string" ||
            typeof eventBody.data.id === "number"
              ? { id: eventBody.data.id }
              : {}),
            ...(reference ? { reference } : {}),
            ...(typeof eventBody.data.transfer_code === "string"
              ? { transfer_code: eventBody.data.transfer_code }
              : {}),
          },
        },
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Unable to record webhook" },
        { status: 500 },
      );
    }
    eventRecord = await prisma.webhookEvent.findUnique({ where: { eventKey } });
    if (eventRecord?.processed) return NextResponse.json({ received: true });
    if (!eventRecord)
      return NextResponse.json(
        { error: "Unable to load webhook" },
        { status: 500 },
      );
  }

  try {
    if (eventType === "charge.success") {
      if (!reference) throw new Error("Charge event has no reference");
      const verified = await verifyPaystackTransaction(reference);
      await marketplacePayments.markPaymentSuccessful(reference, verified);
    } else if (eventType === "charge.failed") {
      if (!reference) throw new Error("Charge event has no reference");
      await marketplacePayments.markPaymentFailed(reference);
    } else if (eventType === "transfer.success") {
      if (!reference) throw new Error("Transfer event has no reference");
      const verified = await verifyPaystackTransfer(reference);
      await marketplacePayments.markTransferStatus(
        reference,
        "SUCCESS",
        typeof eventBody.data.transfer_code === "string"
          ? eventBody.data.transfer_code
          : undefined,
        eventKey,
        verified,
      );
    } else if (
      eventType === "transfer.failed" ||
      eventType === "transfer.reversed"
    ) {
      if (!reference) throw new Error("Transfer event has no reference");
      await marketplacePayments.markTransferStatus(
        reference,
        eventType === "transfer.failed" ? "FAILED" : "REVERSED",
        typeof eventBody.data.transfer_code === "string"
          ? eventBody.data.transfer_code
          : undefined,
        eventKey,
      );
    }

    await prisma.webhookEvent.update({
      where: { id: eventRecord.id },
      data: { processed: true, processedAt: new Date(), error: null },
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    await prisma.webhookEvent
      .update({
        where: { id: eventRecord.id },
        data: {
          error:
            error instanceof Error
              ? error.message.slice(0, 1000)
              : "Webhook processing failed",
        },
      })
      .catch(() => undefined);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
