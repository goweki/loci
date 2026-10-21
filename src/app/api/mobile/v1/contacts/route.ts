import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mobileAuth, pagination, paged } from "@/lib/auth/mobile-api";

export const GET = mobileAuth(async (request: NextRequest, auth) => {
  const { page, limit, skip } = pagination(request);
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const where = { userId: auth.user.id, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { phoneNumber: { contains: q } }] } : {}) };
  const [items, total] = await Promise.all([prisma.contact.findMany({ where, select: { id: true, phoneNumber: true, name: true, avatar: true, lastMessageAt: true, createdAt: true, _count: { select: { messages: true } } }, orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }], skip, take: limit }), prisma.contact.count({ where })]);
  return NextResponse.json({ success: true, data: paged(items, total, page, limit) });
});
