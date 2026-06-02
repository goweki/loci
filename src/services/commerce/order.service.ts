import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Currency,
  Order,
  OrderStatus,
  Prisma,
  UserRole,
} from "@/lib/prisma/generated";

export type OrderServiceContext = {
  userId: string;
  role: UserRole;
};

export class OrderService {
  private userId: string;
  private role: UserRole;

  private constructor({ userId, role }: OrderServiceContext) {
    this.userId = userId;
    this.role = role;
  }

  /**
   * 🛠️ Initialize service with logged-in user context
   */
  static async create() {
    const user = await requireUser();

    return new OrderService({
      userId: user.id,
      role: user.role as UserRole,
    });
  }

  /**
   * 🔐 Centralized access control
   * Admins can view any order, standard users are strictly scoped to their own userId.
   */
  private scope<T extends Prisma.OrderWhereInput>(
    where: T = {} as T,
  ): Prisma.OrderWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      userId: this.userId,
    };
  }

  /**
   * 📦 Create a new Order with nested OrderItems atomically
   */
  async createOrder(data: {
    contactId?: string;
    currency: Currency;
    notes?: string;
    total: number;
    paymentLink?: string;
    items: (
      | {
          productId: string;
          name: string;
          quantity: number;
          unitPrice: number;
          total: number;
        }
      | {
          productId: null;
          name: string;
          quantity: number;
          unitPrice: number;
          total: number;
        }
    )[];
  }): Promise<Order> {
    const { items, ...orderData } = data;

    return prisma.order.create({
      data: {
        ...orderData,
        userId: this.userId, // Context enforced
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
   * 🔎 Get single order by ID with structural scoping checks
   */
  async getOrderById(id: string) {
    const order = await prisma.order.findFirst({
      where: this.scope({ id }),
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

    if (!order) {
      throw new Error("Order not found or unauthorized access");
    }

    return order;
  }

  /**
   * 👥 Get all orders with filtering, pagination, and multi-tenant scoping
   */
  async getOrders(params?: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
    search?: string;
  }) {
    const { status, limit = 20, cursor, search } = params || {};

    return prisma.order.findMany({
      where: this.scope({
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { id: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
                {
                  contact: { name: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {}),
      }),
      include: {
        items: true,
        payments: true,
        contact: true,
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
   * 🏷️ Update status or add invoice reference details
   */
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    paymentLink?: string,
  ): Promise<Order> {
    // Assert existence and access rights first
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
   * 💳 Fetch all payments linked to a structural subscription context
   */
  async getPaymentsBySubscriptionId(subscriptionId: string) {
    return prisma.payment.findMany({
      where: {
        order: this.scope({
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
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ❌ Securely cancel an order
   */
  async cancelOrder(id: string): Promise<Order> {
    // Assert execution rights
    await this.getOrderById(id);

    return prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  }
}
