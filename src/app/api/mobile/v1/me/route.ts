import { NextResponse } from "next/server";
import { mobileAuth } from "@/lib/auth/mobile-api";
import prisma from "@/lib/prisma";

export const GET = mobileAuth(async (_request, auth) => {
  const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { id: true, username: true, name: true, email: true, tel: true, image: true, role: true, status: true, preferredCommunicationChannel: true, createdAt: true, waba: { select: { id: true, name: true, ownership: true, phoneNumbers: { select: { id: true, phoneNumber: true, displayName: true, status: true, verifiedAt: true } } } }, subscriptions: { where: { status: { in: ["ACTIVE", "INCOMPLETE", "PAST_DUE"] } }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, interval: true, currentPeriodEnd: true, plan: { select: { name: true, maxPhoneNumbers: true, maxMessagesPerMonth: true } } } } } });
  return NextResponse.json({ success: true, data: user });
});
