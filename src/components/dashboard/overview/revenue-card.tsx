import { DollarSign } from "lucide-react";

import { StatCard } from "@/components/dashboard/shared/stat-card";

import { OrderService } from "@/services/commerce/order.service";

export async function RevenueCard() {
  const orderService = await OrderService.create();
  const revenue = await orderService.getTotalRevenue();

  return (
    <StatCard
      title="Revenue"
      value={`KES ${Number(revenue).toLocaleString()}`}
      icon={DollarSign}
    />
  );
}
