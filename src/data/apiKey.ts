import "server-only";

import prisma from "@/lib/prisma";
import { ApiKey, Prisma } from "@/lib/prisma/generated";

export const getApiKeysByUserId = async (userId: string) => {
  if (!userId) {
    throw new Error("No userId provided");
  }

  return prisma.apiKey.findMany({
    where: {
      createdById: userId,
    },
    orderBy: [
      {
        // Primary: Keep Active keys at the top
        isActive: "desc",
      },
      {
        // Secondary: Newest keys first within their respective status groups
        createdAt: "desc",
      },
    ],
  });
};

/**
 * API Key Permissions
 */

export type ApiKeyPermissions = {
  read: boolean;
  write: boolean;
};

export function getApiKeyPermissions(
  value: Prisma.JsonValue,
): ApiKeyPermissions {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "read" in value &&
    "write" in value &&
    typeof (value as any).read === "boolean" &&
    typeof (value as any).write === "boolean"
  ) {
    return value as ApiKeyPermissions;
  }
  // fallback / default / throw — your choice
  return { read: true, write: true };
}
