import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/prisma/generated";

export async function getDashboardStatsSummary(userId: string) {
  const [
    totalContacts,
    totalProducts,
    totalOrders,
    pendingOrders,
    totalInvoices,
    totalMessages,
    lowStockProducts,
    recentOrders,
    recentInvoices,
    recentContacts,
    revenueResult,
  ] = await Promise.all([
    prisma.contact.count({
      where: { userId },
    }),

    prisma.product.count({
      where: { userId },
    }),

    prisma.order.count({
      where: { userId },
    }),

    prisma.order.count({
      where: {
        userId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.SENT,
            OrderStatus.PARTIALLY_PAID,
          ],
        },
      },
    }),

    prisma.invoice.count({
      where: { userId },
    }),

    prisma.message.count({
      where: { userId },
    }),

    prisma.product.findMany({
      where: {
        userId,
        stockQty: {
          lte: 5,
        },
      },
      take: 10,
      orderBy: {
        stockQty: "asc",
      },
    }),

    prisma.order.findMany({
      where: { userId },
      include: {
        contact: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.invoice.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.contact.findMany({
      where: { userId },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 5,
    }),

    prisma.payment.aggregate({
      where: {
        order: {
          userId,
        },
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const revenue = Number(revenueResult._sum.amount ?? 0);

  return {
    revenue,
    revenueGrowth: 0,

    totalProducts,
    totalOrders,
    pendingOrders,

    totalContacts,
    newContacts: 0,

    totalInvoices,

    totalConversations: totalMessages,
    unreadConversations: 0,

    inventoryAlerts: lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      stockQty: product.stockQty,
    })),

    recentOrders,

    recentInvoices,

    recentConversations: recentContacts.map((contact) => ({
      id: contact.id,
      contactName: contact.name,
      phoneNumber: contact.phoneNumber,
      lastMessage: contact.name ?? `Conversation with ${contact.phoneNumber}`,
      unreadCount: 0,
      lastMessageAt: contact.lastMessageAt ?? contact.updatedAt,
    })),

    salesChartData: [],

    activities: [
      ...recentOrders.map((order) => ({
        id: order.id,
        title: "Order created",
        description: `Order ${order.id.slice(-6)}`,
        createdAt: order.createdAt,
      })),

      ...recentInvoices.map((invoice) => ({
        id: invoice.id,
        title: "Invoice generated",
        description: invoice.invoiceNumber,
        createdAt: invoice.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10),
  };
}
