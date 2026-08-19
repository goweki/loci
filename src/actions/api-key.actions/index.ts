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
  userId: string,
  description: string,
): Promise<string> => {
  const newKey = await createApiKey({
    userId,
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
    if (actor.role !== UserRole.ADMIN) {
      const token = await prisma.token.findUniqueOrThrow({
        where: {
          type_userId: {
            type: TokenType.API_KEY,
            userId: actor.id,
          },
        },
      });
      if (token.userId !== actor.id) {
        throw "NOT ALLOWED";
      }
    }

    !!(await prisma.token.update({
      where: { id: keyId },
      data: { isActive: false },
    }));

    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
};
