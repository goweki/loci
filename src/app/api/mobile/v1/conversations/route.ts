import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mobileAuth, pagination, paged } from "@/lib/auth/mobile-api";

export const GET = mobileAuth(async (request: NextRequest, auth) => {
  const { page, limit, skip } = pagination(request);
  const where = { userId: auth.user.id };
  const contacts = await prisma.contact.findMany({ where: { userId: auth.user.id, messages: { some: {} } }, select: { id: true, phoneNumber: true, name: true, avatar: true, lastMessageAt: true, messages: { orderBy: { timestamp: "desc" }, take: 1, select: { id: true, type: true, content: true, direction: true, status: true, timestamp: true } }, _count: { select: { messages: true } } }, orderBy: { lastMessageAt: "desc" }, skip, take: limit });
  const total = await prisma.contact.count({ where: { ...where, messages: { some: {} } } });
  return NextResponse.json({ success: true, data: paged(contacts, total, page, limit) });
});
