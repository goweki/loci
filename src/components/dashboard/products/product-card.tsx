import Image from "next/image";
import Link from "next/link";

import { Product } from "@/lib/prisma/generated";

import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ProductActionsDropdown } from "./product-actions-dropdown";
import { ProductWithRelations } from "@/services/commerce/product.service";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={product.imageUrl || "/placeholder-product.jpg"}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{product.name}</h3>

            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          </div>

          <ProductActionsDropdown productId={product.id} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            KES {Number(product.price).toLocaleString()}
          </div>

          <Badge variant="secondary">{product.stockQty} in stock</Badge>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" variant="outline" asChild>
          <Link href={`/dashboard/products/${product.id}`}>View Product</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
