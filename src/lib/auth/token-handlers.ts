import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TokenType } from "../prisma/generated";
import { addToDate } from "../utils/dateHandlers";
import { getUserById } from "@/data/user";
import { tokenRepository } from "@/data/repositories/token.repository";

export type ApiKeyAuth = {
  id: string;
  user: { id: string };
};

export type ApiKeyValidationResult = ApiKeyAuth | NextResponse;

/**
 * Generate secure API key string
 */
function generateApiKeyString() {
  return "loc_i_" + crypto.randomBytes(32).toString("hex");
}

/**
 * Hash API key before storage
 */
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
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
  const user = await getUserById(options.userId);
  if (!user) {
    throw new Error("User not found");
  }

  const rawKey = generateApiKeyString();

  const keyHash = hashToken(rawKey);

  const apiKey = await tokenRepository.upsertToken({
    userId: options.userId,
    description: options.description,
    type: TokenType.API_KEY,
    hashedToken: keyHash,
    expiresAt: options.expiresAt,
    isActive: true,
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

  const hashedToken = hashToken(token);

  const apiKey_inDb = await tokenRepository.findValidToken(hashedToken, type);

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
  await tokenRepository.touch(apiKey_inDb.id);

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
  apiKey: { id: string; user: { id: string } },
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
