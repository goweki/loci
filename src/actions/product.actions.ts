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

export async function adjustProductStockAction(
  productId: string,
  direction: "ADD" | "REMOVE",
  quantity: number,
  requestId: string,
): Promise<ActionResult<{ productId: string; name: string; stockQty: number }>> {
  try {
    if (!productId || !/^[0-9a-f-]{36}$/i.test(requestId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) {
      throw new Error("Choose a product and enter a whole-number quantity from 1 to 100,000.");
    }
    const service = await ProductService.create();
    const product = await service.updateStock(
      productId,
      direction === "ADD" ? quantity : -quantity,
      requestId,
    );
    if (!product) throw new Error("Product not found or access denied.");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/inventory");
    return { ok: true, data: { productId, name: product.name, stockQty: product.stockQty } };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
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

export async function getPublicProductById(
  productId: string,
): Promise<ActionResult<ProductWithRelations>> {
  try {
    const product = await ProductService.getPublicProductById(productId);

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

export async function getPlanByName(planName: PlanName): Promise<
  ActionResult<
    Prisma.PlanGetPayload<{
      include: {
        subscriptions: true;
      };
    }>
  >
> {
  try {
    const plan = await prisma.plan.findUnique({
      where: {
        name: planName,
      },
      include: {
        subscriptions: true,
      },
    });

    if (!plan) notFound();

    return {
      ok: true,
      data: plan,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
