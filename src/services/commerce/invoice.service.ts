import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

export class InvoiceService {
  static async createInvoiceFromOrder(
    orderId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const db = txClient ?? prisma;

    const order = await db.order.findUnique({
      where: { id: orderId },

      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const tax = Number(order.subtotal) * 0.16;

    const total = Number(order.subtotal) + tax;

    const invoiceNumber = `INV-${Date.now()}`;

    return db.invoice.create({
      data: {
        userId: order.userId,
        orderId: order.id,

        invoiceNumber,

        subtotal: order.subtotal,
        tax,
        total,

        currency: order.currency,

        status: "PENDING",
      },
    });
  }
}
