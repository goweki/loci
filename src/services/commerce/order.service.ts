import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Currency,
  Order,
  OrderStatus,
  Prisma,
  UserRole,
} from "@/lib/prisma/generated";

type OrderServiceContext = {
  userId: string;
  role: UserRole;
};

export class OrderService {
  private userId: string;
  private role: UserRole;

  private constructor(ctx: OrderServiceContext) {
    this.userId = ctx.userId;
    this.role = ctx.role;
  }

  static async create() {
    const user = await requireUser();

    return new OrderService({
      userId: user.id,
      role: user.role as UserRole,
    });
  }

  /**
   * Multi-tenant scoping
   */
  private scope(where: Prisma.OrderWhereInput = {}): Prisma.OrderWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * Create Order
   */
  async createOrder(data: {
    contactId?: string;
    currency: Currency;
    notes?: string;
    total: number;
    paymentLink?: string;
    items: {
      productId?: string | null;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  }) {
    const { items, ...orderData } = data;

    return prisma.order.create({
      data: {
        ...orderData,
        userId: this.userId,
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
   * Single Order
   */
  async getOrderById(id: string) {
    const order = await prisma.order.findFirst({
      where: this.scope({ id }),
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        invoice: true,
        contact: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }

  /**
   * Orders List
   */
  async getOrders(params?: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
    search?: string;
  }) {
    const { status, limit = 20, cursor, search } = params ?? {};

    return prisma.order.findMany({
      where: this.scope({
        ...(status && { status }),

        ...(search && {
          OR: [
            {
              id: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              notes: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              contact: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }),
      }),

      include: {
        contact: true,
        items: true,
        payments: true,
        invoice: true,
      },

      take: limit,

      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Update Status
   */
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    paymentLink?: string,
  ) {
    await this.getOrderById(id);

    return prisma.order.update({
      where: { id },
      data: {
        status,
        ...(paymentLink && { paymentLink }),
      },
    });
  }

  /**
   * Cancel
   */
  async cancelOrder(id: string) {
    await this.getOrderById(id);

    return prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  }

  /**
   * Dashboard Revenue
   */
  async getTotalRevenue() {
    const result = await prisma.order.aggregate({
      where: this.scope({
        status: {
          in: [OrderStatus.PAID, OrderStatus.PARTIALLY_PAID],
        },
      }),
      _sum: {
        total: true,
      },
    });

    return Number(result._sum.total ?? 0);
  }

  /**
   * Dashboard Counts
   */
  async getOrderStats() {
    const [totalOrders, paidOrders, pendingOrders] = await Promise.all([
      prisma.order.count({
        where: this.scope(),
      }),

      prisma.order.count({
        where: this.scope({
          status: OrderStatus.PAID,
        }),
      }),

      prisma.order.count({
        where: this.scope({
          status: OrderStatus.PENDING,
        }),
      }),
    ]);

    return {
      totalOrders,
      paidOrders,
      pendingOrders,
    };
  }

  /**
   * Recent Orders
   */
  async getRecentOrders(limit = 5) {
    return prisma.order.findMany({
      where: this.scope(),
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }
}
