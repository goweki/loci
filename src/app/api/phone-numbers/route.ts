// app/api/phone-numbers/route.ts

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PhoneNumberStatus } from "@/lib/prisma/generated";
import prisma from "@/lib/prisma";
import { getUserSubscription } from "@/actions/subscription.actions";
import { createPhoneNumberAction } from "@/actions/phoneNumber.actions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { phoneNumber, displayName, wabaId } = body;

  const subscriptionStatus = await getUserSubscription();

  if (!subscriptionStatus.ok || !subscriptionStatus.data.subscription) {
    return NextResponse.json(
      { error: "Get a plan to add a phone number" },
      { status: 402 },
    );
  }

  const subscription = subscriptionStatus.data.subscription;

  const maxPhoneNumbers = subscription.plan.maxPhoneNumbers;
  const phoneNumbers = await prisma.phoneNumber.findMany({
    where: { waba: { userId: session.user.id } },
  });

  // check against limit
  if (phoneNumbers.length > maxPhoneNumbers) {
    return NextResponse.json(
      {
        error: "Message limit exceeded for your current plan.",
        limit: maxPhoneNumbers,
        used: phoneNumbers.length,
      },
      { status: 403 },
    );
  }

  // Create phone number record
  const newPhoneNumber = await createPhoneNumberAction({
    wabaId,
    phoneNumber,
    displayName,
    status: PhoneNumberStatus.NOT_VERIFIED,
  });

  return NextResponse.json({ phoneNumber: newPhoneNumber });
}
