"use server";

import { revalidatePath } from "next/cache";

import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ActionResult } from "@/types";
import {
  ProductService,
  ProductWithRelations,
} from "@/services/commerce/product.service";
import { requireUser } from "@/lib/auth";
import { Product } from "@/lib/prisma/generated";
import { notFound } from "next/navigation";

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

export async function getUserProducts(): Promise<ActionResult<Product[]>> {
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
