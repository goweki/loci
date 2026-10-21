import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mobileAuth, pagination, paged } from "@/lib/auth/mobile-api";

export const GET = mobileAuth(async (request: NextRequest, auth) => {
  const { page, limit, skip } = pagination(request);
  const where = { userId: auth.user.id };
  const [items, total] = await Promise.all([prisma.order.findMany({ where, select: { id: true, status: true, fulfillmentStatus: true, currency: true, total: true, buyerName: true, buyerEmail: true, buyerPhone: true, createdAt: true, items: { select: { id: true, name: true, quantity: true, unitPrice: true, total: true } }, payments: { select: { id: true, amount: true, currency: true, status: true, paidAt: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }), prisma.order.count({ where })]);
  return NextResponse.json({ success: true, data: paged(items, total, page, limit) });
});
