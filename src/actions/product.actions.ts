"use server";

import { revalidatePath } from "next/cache";

import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ActionResult } from "@/types";
import {
  Product,
  ProductService,
  ProductWithRelations,
} from "@/services/commerce/product.service";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PlanName } from "@/lib/prisma/generated";
import prisma from "@/lib/prisma";

export async function createProductAction(data: {
  name: string;
  price: number;
  stockQty?: number;
}): Promise<ActionResult<Product>> {
  const user = await requireUser();
  try {
    const product = await ProductService.createProduct({
      ...data,
      userId: user.id,
    });

    revalidatePath("/dashboard/products");

    return {
      ok: true,
      data: product,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getUserProducts(): Promise<
  ActionResult<ProductWithRelations[]>
> {
  try {
    const products = await ProductService.getUserProducts();

    return {
      ok: true,
      data: products,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getProductById(
  productId: string,
): Promise<ActionResult<ProductWithRelations>> {
  try {
    const product = await ProductService.getProductById(productId);

    if (!product) notFound();

    return {
      ok: true,
      data: product,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}

export async function getProductByPlanName(
  planName: PlanName,
): Promise<ActionResult<Product>> {
  try {
    const plan_ = await prisma.plan.findUnique({
      where: {
        name: planName,
      },
      include: {
        product: true,
      },
    });

    const product = plan_?.product;

    if (!product) notFound();

    return {
      ok: true,
      data: { ...product, price: product.price.toNumber() },
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
