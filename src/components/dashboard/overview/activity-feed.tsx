import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Package, ShoppingCart, Receipt, MessageCircle } from "lucide-react";

interface ActivityFeedProps {
  activities: {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
  }[];
}

type ActivityType =
  | "ORDER_CREATED"
  | "INVOICE_SENT"
  | "PAYMENT_RECEIVED"
  | "MESSAGE_RECEIVED"
  | "LOW_STOCK";

const iconMap = {
  ORDER_CREATED: ShoppingCart,
  INVOICE_SENT: Receipt,
  PAYMENT_RECEIVED: Receipt,
  MESSAGE_RECEIVED: MessageCircle,
  LOW_STOCK: Package,
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            // const Icon = iconMap[activity.type];

            return (
              <div key={activity.id}>
                <p className="font-medium text-sm">{activity.title}</p>

                <p className="text-muted-foreground text-xs">
                  {activity.description}
                </p>

                <p className="text-muted-foreground text-xs">
                  {activity.createdAt.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
