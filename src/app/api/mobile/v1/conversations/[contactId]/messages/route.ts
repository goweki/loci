import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mobileAuth, pagination, paged } from "@/lib/auth/mobile-api";

export const GET = mobileAuth(async (request: NextRequest, auth) => {
  const contactId = request.nextUrl.pathname.split("/").at(-2)!;
  const contact = await prisma.contact.findFirst({ where: { id: contactId, userId: auth.user.id }, select: { id: true } });
  if (!contact) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const { page, limit, skip } = pagination(request);
  const where = { contactId, userId: auth.user.id };
  const [items, total] = await Promise.all([prisma.message.findMany({ where, select: { id: true, type: true, content: true, direction: true, status: true, timestamp: true, phoneNumberId: true }, orderBy: { timestamp: "desc" }, skip, take: limit }), prisma.message.count({ where })]);
  return NextResponse.json({ success: true, data: paged(items, total, page, limit) });
});
