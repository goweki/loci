// app/api/phone-numbers/route.ts

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { createPhoneNumber, getPhoneNumbersByUser } from "@/data/phoneNumber";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { phoneNumber, displayName } = body;

  const subscriptionStatus = await getSubscriptionStatusByUserId(
    session.user.id
  );

  if (!subscriptionStatus.plan) {
    return NextResponse.json(
      { error: "Get a plan to add a phone number" },
      { status: 402 }
    );
  }

  const maxPhoneNumbers = subscriptionStatus.plan.maxPhoneNumbers;
  const phoneNumbers = await getPhoneNumbersByUser(session.user.id);

  // check against limit
  if (phoneNumbers.length > maxPhoneNumbers) {
    return NextResponse.json(
      {
        error: "Message limit exceeded for your current plan.",
        limit: maxPhoneNumbers,
        used: phoneNumbers.length,
      },
      { status: 403 }
    );
  }

  // Create phone number record
  const newPhoneNumber = await createPhoneNumber({
    userId: session.user.id,
    phoneNumber,
    displayName,
    status: "PENDING",
  });

  return NextResponse.json({ phoneNumber: newPhoneNumber });
}
