"use server";

import { createApiKey } from "@/lib/auth/token-handlers";
import { addToDate } from "@/lib/utils/dateHandlers";
import { TokenType, UserRole } from "@/lib/prisma/generated";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiKey } from "./api-key.actions.dto";
import { ActionResult } from "@/types";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";

export const getUserApiKeys = async (): Promise<ApiKey[]> => {
  const actor = await requireUser();

  const keys = await prisma.token.findMany({
    where: { userId: actor.id, type: TokenType.API_KEY },
  });

  return keys.map((key) => ({
    id: key.id,
    type: key.type,
    isActive: key.isActive,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    description: key.description,
  }));
};

export const generateUserApiKey = async (
  description: string,
): Promise<string> => {
  const actor = await requireUser();
  const newKey = await createApiKey({
    userId: actor.id,
    description,
    expiresAt: addToDate({ days: 1 }),
  });
  return newKey.apiKey;
};

export const revokeApiKey = async (
  keyId: string,
): Promise<ActionResult<undefined>> => {
  const actor = await requireUser();

  try {
    const result = await prisma.token.updateMany({
      where: {
        id: keyId,
        type: TokenType.API_KEY,
        ...(actor.role === UserRole.ADMIN ? {} : { userId: actor.id }),
      },
      data: { isActive: false },
    });
    if (result.count !== 1) throw new Error("API key not found or access denied.");

    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
};
