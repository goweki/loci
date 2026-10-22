import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mobileAuth, pagination, paged } from "@/lib/auth/mobile-api";

export const GET = mobileAuth(async (request: NextRequest, auth) => {
  const { page, limit, skip } = pagination(request);
  const where = { userId: auth.user.id, ...(request.nextUrl.searchParams.get("q") ? { name: { contains: request.nextUrl.searchParams.get("q")!, mode: "insensitive" as const } } : {}) };
  const [items, total] = await Promise.all([prisma.product.findMany({ where, select: { id: true, name: true, description: true, sku: true, price: true, currency: true, stockQty: true, imageUrl: true, isActive: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, skip, take: limit }), prisma.product.count({ where })]);
  return NextResponse.json({ success: true, data: paged(items, total, page, limit) });
});
