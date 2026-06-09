import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="text-muted-foreground">
          Overview of your business activity
        </p>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/dashboard/orders/create">New Order</Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/dashboard/products/create">New Product</Link>
        </Button>
      </div>
    </div>
  );
}
