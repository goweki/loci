"use server";

import prisma from "@/lib/prisma"; // or wherever your Prisma client is
import { Prisma } from "@/lib/prisma/generated";

/**
 * Finds an account by provider + providerAccountId
 */
export async function getAccountByProviderAndId(
  provider: string,
  providerAccountId: string
) {
  return prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
  });
}

/**
 * Creates a new linked account
 */
export async function createAccount(
  data: Prisma.AccountCreateInput | Prisma.AccountUncheckedCreateInput
) {
  return prisma.account.create({ data });
}

/**
 * Creates or updates a linked account for the user
 */
export async function upsertAccount(
  userId: string,
  data: Prisma.AccountCreateInput | Prisma.AccountUncheckedCreateInput
) {
  return prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    },
    update: {},
    create: data,
  });
}
