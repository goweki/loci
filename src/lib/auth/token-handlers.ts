import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TokenType } from "../prisma/generated";
import { UserService } from "@/services/user/user.service";
import { hashSha256 } from "../utils/passwordHandlers";

export type ApiKeyAuth = {
  id: string;
  user: { id: string; username: string };
};

export type ApiKeyValidationResult = ApiKeyAuth | NextResponse;

/**
 * Generate secure API key string
 */
function generateApiKeyString() {
  return (
    `loc_${TokenType.API_KEY.toLocaleLowerCase()}_` +
    crypto.randomBytes(32).toString("hex")
  );
}

/**
 * Create API key
 * Returns raw key ONLY ONCE
 */
export async function createApiKey(options: {
  userId: string;
  expiresAt: Date;
  description: string;
}) {
  const user = await UserService.getUserByKey(options.userId);
  if (!user) {
    throw new Error("User not found");
  }

  const rawKey = generateApiKeyString();

  const keyHash = hashSha256(rawKey);

  const apiKey = await prisma.token.upsert({
    where: {
      type_userId: {
        type: TokenType.API_KEY,
        userId: options.userId,
      },
    },
    create: {
      userId: options.userId,
      description: options.description,
      type: TokenType.API_KEY,
      hashedToken: keyHash,
      expiresAt: options.expiresAt,
      isActive: true,
    },
    update: {
      description: options.description,
      hashedToken: keyHash,
      expiresAt: options.expiresAt,
      isActive: true,
    },
  });

  return {
    id: apiKey.id,
    apiKey: rawKey,
  };
}

/**
 * Validate Token
 */
export async function validateToken(
  token: string,
  type: TokenType,
): Promise<ApiKeyValidationResult> {
  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const hashedToken = hashSha256(token);

  const apiKey_inDb = await prisma.token.findFirst({
    where: { hashedToken, type },
    include: { user: true },
  });

  if (!apiKey_inDb) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (!apiKey_inDb.isActive) {
    return NextResponse.json({ error: "API key revoked" }, { status: 401 });
  }

  if (apiKey_inDb.expiresAt && apiKey_inDb.expiresAt < new Date()) {
    return NextResponse.json({ error: "API key expired" }, { status: 401 });
  }

  /**
   * Update last used timestamp
   */
  await prisma.token.update({
    where: { id: apiKey_inDb.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: apiKey_inDb.id,
    user: apiKey_inDb.user,
  };
}

/**
 * Extract API key from request
 */
export function extractApiKey(req: Request): string {
  const headerKey = req.headers.get("api-key") || req.headers.get("x-api-key");
  if (headerKey) return headerKey;

  const auth = req.headers.get("Authorization");
  if (!auth) {
    console.error("Authorization failed");
    return "";
  }
  return auth.replace(/^Bearer\s+/i, "");
}

export type AuthenticatedHandler = (
  request: NextRequest,
  apiKey: { id: string; user: { id: string; username: string } },
) => Promise<Response | NextResponse> | Response | NextResponse;

export function apiKeyMiddleware(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    const apiKey =
      request.headers.get("api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    const auth = await validateToken(apiKey || "", TokenType.API_KEY);

    if (auth instanceof NextResponse) {
      return auth;
    }

    return handler(request, auth);
  };
}
