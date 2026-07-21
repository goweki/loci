"use server";

import { revalidatePath } from "next/cache";

import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ActionResult } from "@/types";
import {
  ProductService,
  ProductWithRelations,
} from "@/services/commerce/product.service";
import { notFound } from "next/navigation";
import { Currency, PlanName, Prisma } from "@/lib/prisma/generated";
import prisma from "@/lib/prisma";

export async function createProductAction(data: {
  name: string;
  description: string;
  price: number;
  currency: Currency;
  stockQty?: number;
  imageUrl?: string;
}): Promise<
  ActionResult<
    Omit<Prisma.ProductGetPayload<{}>, "price"> & {
      price: number;
    }
  >
> {
  try {
    const productService = await ProductService.create();
    const product = await productService.createProduct(data);

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
    const productService = await ProductService.create();
    const products = await productService.getProducts();

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
    const productService = await ProductService.create();
    const product = await productService.getProductById(productId);

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

export async function getProductByPlanName(planName: PlanName): Promise<
  ActionResult<
    Omit<Prisma.ProductGetPayload<{}>, "price"> & {
      price: number;
    }
  >
> {
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
