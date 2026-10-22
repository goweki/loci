import { NextResponse } from "next/server";
import { mobileAuth } from "@/lib/auth/mobile-api";
import { createApiKey } from "@/lib/auth/token-handlers";

export const POST = mobileAuth(async (_request, auth) => {
  const token = await createApiKey({ userId: auth.user.id, description: "mobile-app", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
  return NextResponse.json({ success: true, data: { accessToken: token.apiKey, tokenType: "Bearer", expiresAt: token.expiresAt } });
});
