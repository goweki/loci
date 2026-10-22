import { NextRequest, NextResponse } from "next/server";
import { apiKeyMiddleware, AuthenticatedHandler } from "@/lib/auth/token-handlers";
import prisma from "@/lib/prisma";

export const mobileAuth = (handler: AuthenticatedHandler) =>
  apiKeyMiddleware(async (request, auth) => {
    const fullUser = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { id: true, username: true, status: true } });
    if (!fullUser) return NextResponse.json({ error: "Account not found" }, { status: 401 });
    return handler(request, { ...auth, user: fullUser });
  });

export function pagination(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 25)));
  return { page, limit, skip: (page - 1) * limit };
}

export function paged<T>(items: T[], total: number, page: number, limit: number) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
