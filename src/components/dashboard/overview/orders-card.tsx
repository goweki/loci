import { ShoppingCart } from "lucide-react";

import { StatCard } from "@/components/dashboard/shared/stat-card";

import { OrderService } from "@/services/commerce/order.service";

export async function OrdersCard() {
  const orderService = await OrderService.create();
  const orders = await orderService.getOrderStats();

  return (
    <StatCard title="Orders" value={orders.totalOrders} icon={ShoppingCart} />
  );
}
