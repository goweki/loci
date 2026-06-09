import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@/lib/prisma/generated";

type RecentOrdersProps = {
  orders: Prisma.OrderGetPayload<{
    include: {
      contact: true;
      items: true;
    };
  }>[];
};

export async function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <div>
                <p className="font-medium">#{order.id.slice(-8)}</p>

                <p className="text-sm text-muted-foreground">
                  {order.contact?.name ?? "Walk-in Customer"}
                </p>
              </div>

              <div className="text-right">
                <p className="font-medium">
                  KES {Number(order.total).toLocaleString()}
                </p>

                <Badge variant="secondary">{order.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
