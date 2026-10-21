import { NextResponse } from "next/server";
import { mobileAuth } from "@/lib/auth/mobile-api";
import prisma from "@/lib/prisma";

export const GET = mobileAuth(async (_request, auth) => {
  const items = await prisma.phoneNumber.findMany({ where: { waba: { userId: auth.user.id } }, select: { id: true, phoneNumber: true, displayName: true, status: true, verifiedAt: true, whatsappRegistrationStatus: true, createdAt: true, waba: { select: { id: true, name: true, ownership: true } }, _count: { select: { messages: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: items });
});
