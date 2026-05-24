import prisma from "@/lib/prisma";
import { Order, OrderStatus, Prisma } from "@/lib/prisma/generated";

export class OrderRepository {
  /**
   * Create a new Order along with its nested OrderItems atomically.
   */
  async create(data: {
    userId: string;
    contactId?: string;
    currency?: string;
    notes?: string;
    subtotal: number | Prisma.Decimal;
    total: number | Prisma.Decimal;
    paymentLink?: string;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number | Prisma.Decimal;
      total: number | Prisma.Decimal;
    }>;
  }): Promise<Order> {
    const { items, ...orderData } = data;

    return prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Find a single order by its ID with all structural child relationships included.
   */
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                lociPlan: true,
              },
            },
          },
        },
        payments: true,
        invoice: true,
        contact: true,
      },
    });
  }

  /**
   * Fetch all orders for a specific user with pagination support.
   */
  async findManyByUserId(params: {
    userId: string;
    status?: OrderStatus;
    skip?: number;
    take?: number;
  }) {
    const { userId, status, skip = 0, take = 20 } = params;

    return prisma.order.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    });
  }

  /**
   * Update an existing order status or payment details.
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    paymentLink?: string,
  ): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        status,
        ...(paymentLink && { paymentLink }),
      },
    });
  }

  /**
   * Find a specific payment record sequence attached to a Subscription using structural pathing.
   */
  async getPaymentsBySubscriptionId(subscriptionId: string) {
    return prisma.payment.findMany({
      where: {
        order: {
          items: {
            some: {
              product: {
                subscriptions: {
                  some: {
                    id: subscriptionId,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Soft-delete or cancel an order cleanly.
   */
  async cancelOrder(id: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  }
}
