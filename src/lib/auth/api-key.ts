import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiKey } from "../prisma/generated";
import { addToDate } from "../utils/dateHandlers";

export type ApiKeyAuth = {
  id: string;
  permissions: any;
  user: { id: string };
};

export type ApiKeyValidationResult = ApiKeyAuth | NextResponse;

/**
 * Generate secure API key string
 */
export function generateApiKeyString() {
  return "ak_" + crypto.randomBytes(32).toString("hex");
}

/**
 * Hash API key before storage
 */
export function hashApiKey(apiKey: string) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Create API key
 * Returns raw key ONLY ONCE
 */
export async function createApiKey(options: {
  name: string;
  description?: string;
  permissions?: any;
  expiresAt?: Date;
  createdById: string;
}) {
  const rawKey = generateApiKeyString();

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      name: options.name,
      description: options.description,
      keyHash,
      permissions: options.permissions ?? {
        contracts: true,
        users: true,
        loading_advices: true,
      },
      expiresAt: options.expiresAt || addToDate({ months: 12 }),
      createdById: options.createdById,
    },
  });

  return {
    id: apiKey.id,
    apiKey: rawKey, // only returned once
  };
}

/**
 * Validate API key
 */
export async function validateApiKey(
  apiKey: string,
): Promise<ApiKeyValidationResult> {
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const keyHash = hashApiKey(apiKey);

  const record = await prisma.apiKey.findUnique({
    where: {
      keyHash,
    },
    include: { createdBy: { select: { id: true } } },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (!record.isActive) {
    return NextResponse.json({ error: "API key inactive" }, { status: 401 });
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return NextResponse.json({ error: "API key expired" }, { status: 401 });
  }

  /**
   * Update last used timestamp
   */
  await prisma.apiKey.update({
    where: { id: record.id },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return {
    id: record.id,
    permissions: record.permissions,
    user: record.createdBy,
  };
}

/**
 * Disable API key
 */
export async function revokeApiKey(id: string) {
  return prisma.apiKey.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}

/**
 * Reactivate API key
 */
export async function activateApiKey(id: string) {
  return prisma.apiKey.update({
    where: { id },
    data: {
      isActive: true,
    },
  });
}

/**
 * Extract API key from request
 */
export function extractApiKey(req: Request): string {
  const headerKey = req.headers.get("api-key") || req.headers.get("x-api-key");

  if (headerKey) return headerKey;

  const auth = req.headers.get("authorization");

  if (!auth) return "";

  return auth.replace(/^Bearer\s+/i, "");
}

export type AuthenticatedHandler = (
  request: NextRequest,
  apiKey: { id: string; permissions: string[]; user: { id: string } },
) => Promise<Response | NextResponse> | Response | NextResponse;

export function apiKeyMiddleware(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    const apiKey =
      request.headers.get("api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    const auth = await validateApiKey(apiKey || "");

    if (auth instanceof NextResponse) {
      return auth;
    }

    return handler(request, auth);
  };
}
