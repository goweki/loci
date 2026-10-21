import { NextResponse } from "next/server";
import { mobileAuth } from "@/lib/auth/mobile-api";
import prisma from "@/lib/prisma";
import { TokenType } from "@/lib/prisma/generated";

export const POST = mobileAuth(async (_request, auth) => {
  await prisma.token.updateMany({ where: { userId: auth.user.id, type: TokenType.API_KEY }, data: { isActive: false } });
  return NextResponse.json({ success: true });
});
