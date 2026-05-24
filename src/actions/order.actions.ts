"use server";

import prisma from "@/lib/prisma";
import { Currency, Order, Prisma, Product } from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { OrderService } from "@/services/commerce/order.service";
import { ActionResult } from "@/types";

export async function createOrderAction(dto: {
  contactId?: string;
  currency: Currency;
  notes?: string;
  items: (
    | { productId: string; quantity: number }
    | { productId: null; name: string; quantity: number; unitPrice: number }
  )[];
}): Promise<ActionResult<Order>> {
  try {
    // 1. Resolve async product data fetching and map structural records
    const calculatedItems = await Promise.all(
      dto.items.map(async (item) => {
        if (item.productId) {
          const product_ = await prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (!product_) {
            throw new Error(
              `[INVALID_PRODUCT_ID] : Product not found - ${item.productId}`,
            );
          }

          const price = product_.price.toNumber();

          return {
            productId: item.productId,
            name: product_.name,
            quantity: item.quantity,
            unitPrice: price,
            total: item.quantity * price,
          };
        } else {
          return {
            productId: null,
            name: (
              item as {
                productId: null;
                name: string;
                quantity: number;
                unitPrice: number;
              }
            ).name,
            quantity: item.quantity,
            unitPrice: (
              item as {
                productId: null;
                name: string;
                quantity: number;
                unitPrice: number;
              }
            ).unitPrice,
            total:
              item.quantity *
              (
                item as {
                  productId: null;
                  name: string;
                  quantity: number;
                  unitPrice: number;
                }
              ).unitPrice,
          };
        }
      }),
    );

    // 2. Synthesize complete financial subtotals and totals via loop accumulator
    const total = calculatedItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // 3. Initialize the context-aware service layer
    const orderService = await OrderService.create();

    // 4. Securely save to database layer using server-computed calculations
    const order = await orderService.createOrder({
      contactId: dto.contactId,
      currency: dto.currency,
      notes: dto.notes,
      total,
      items: calculatedItems,
    });

    return {
      ok: true,
      data: order,
    };
  } catch (error) {
    return {
      ok: false,
      error: getFriendlyErrorMessage(error),
    };
  }
}
