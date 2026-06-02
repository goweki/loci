import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

export class InvoiceService {
  static async createInvoiceFromOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const tax = Number(order.total) * 0.16;

    const total = Number(order.total) + tax;

    const invoiceNumber = `INV-${Math.floor(Date.now() / 1000)}`;

    return prisma.invoice.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        invoiceNumber,
        subtotal: order.total,
        tax,
        total,
        currency: order.currency,
        status: "PENDING",
      },
    });
  }
}
