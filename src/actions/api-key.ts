"use server";

import { createApiKey } from "@/lib/auth/token-handlers";
import { addToDate } from "@/lib/utils/dateHandlers";
import { tokenRepository } from "@/data/repositories/token.repository";
import { TokenType } from "@/lib/prisma/generated";

export type ApiKey = {
  id: string;
  type: TokenType;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAT: Date | null;
};

export const getUserApiKeys = async (userId: string): Promise<ApiKey[]> => {
  if (!userId) throw new Error("No userId provided");

  const keys = await tokenRepository.getTokensByUser(userId, TokenType.API_KEY);

  return keys.map((key) => ({
    id: key.id,
    type: key.type,
    isActive: key.isActive,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsedAT: key.lastUsedAt,
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

export const revokeApiKey = async (keyId: string): Promise<boolean> => {
  return !!(await tokenRepository.revokeApiKey(keyId));
};
