import prisma from "@/lib/prisma";
import { cache } from "react";

export const getMerchantProducts = cache(async (username: string) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      user: {
        username,
        status: "ACTIVE",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      price: true,
      currency: true,
    },
  });

  return products;
});

export type MerchantProduct = Awaited<
  ReturnType<typeof getMerchantProducts>
>[number];
