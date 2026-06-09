import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AlertTriangle } from "lucide-react";

import { ProductService } from "@/services/commerce/product.service";

export async function InventoryAlerts() {
  const productService = await ProductService.create();
  const products = await productService.getLowStockProducts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Alerts</CardTitle>
      </CardHeader>

      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">No inventory alerts.</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/dashboard/products/${product.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />

                  <span>{product.name}</span>
                </div>

                <span className="font-medium">{product.stockQty} left</span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
