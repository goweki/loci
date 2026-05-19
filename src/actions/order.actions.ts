"use server";

import { Order } from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { OrderService } from "@/services/commerce/order.service";
import { ActionResult } from "@/types";

export async function createOrderAction(dto: {
  userId: string;
  contactId?: string;

  items: {
    productId: string;
    quantity: number;
  }[];
}): Promise<ActionResult<Order>> {
  try {
    const order = await OrderService.createOrder(dto);

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
