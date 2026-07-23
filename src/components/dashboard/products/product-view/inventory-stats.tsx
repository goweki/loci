"use client";

import { Boxes, Package, ShoppingCart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface InventoryStatsProps {
  product: ProductWithRelations;
  inventoryValue: number;
}

export default function InventoryStats({
  product,
  inventoryValue,
}: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-xl bg-muted p-3">
            <Boxes className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Stock</p>

            <p className="text-2xl font-bold">
              {product.stockQty.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-xl bg-muted p-3">
            <ShoppingCart className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Orders</p>

            <p className="text-2xl font-bold">{product.orderItems.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-xl bg-muted p-3">
            <Package className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Inventory Value</p>

            <p className="text-xl font-bold">
              {product.currency} {inventoryValue.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
