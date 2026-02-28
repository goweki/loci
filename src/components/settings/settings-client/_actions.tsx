"use server";

import {
  ApiKeyPermissions,
  getApiKeyPermissions,
  getApiKeysByUserId,
} from "@/data/apiKey";
import { getUserById } from "@/data/user";
import { createApiKey, hashApiKey, revokeApiKey } from "@/lib/auth/api-key";
import { Prisma } from "@/lib/prisma/generated";
import { addToDate } from "@/lib/utils/dateHandlers";

/**
 * API Key
 */

export interface MinimalApiKey {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: ApiKeyPermissions;
  createdAt: Date;
  expiresAt: Date;
}
[];

export const getUserApiKeys = async (
  userId: string,
): Promise<MinimalApiKey[]> => {
  if (!userId) throw new Error("No userId provided");

  const keys = await getApiKeysByUserId(userId);

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    description: key.description,
    isActive: key.isActive,
    permissions: getApiKeyPermissions(key.permissions),
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
  }));
};

export const generateUserApiKey = async (
  userId: string,
  keyName: string,
): Promise<string> => {
  const newKey = await createApiKey({
    name: keyName,
    expiresAt: addToDate({ days: 1 }),
    createdById: userId,
  });
  return newKey.apiKey;
};

export const _revokeApiKey = async (keyId: string): Promise<string> => {
  return (await revokeApiKey(keyId)).name;
};
