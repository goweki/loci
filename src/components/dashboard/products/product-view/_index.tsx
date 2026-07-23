"use client";

import Image from "next/image";

import {
  Package,
  ShoppingCart,
  Boxes,
  BoxIcon,
  XCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import TitleSection from "@/components/ui/page-title";
import { ProductWithRelations } from "@/services/commerce/product.service";
import { useI18n } from "@/lib/i18n";
import { ShareLinkDialog } from "./share-dialog";

interface ProductViewProp {
  product: ProductWithRelations;
  merchantInfo?: boolean;
}

export default function ProductViewComponent({
  product,
  merchantInfo = false,
}: ProductViewProp) {
  const inventoryValue = Number(product.price) * product.stockQty;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Product Image */}
      <Card className="lg:col-span-1">
        <CardContent className="p-6">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Info */}

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Product Name</p>

                <p className="font-medium">{product.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">SKU</p>

                <p className="font-medium">{product.sku || "—"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Price</p>

                <p className="font-medium">
                  {product.currency} {Number(product.price).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>

                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Description</p>

              <p className="leading-relaxed">
                {product.description || "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        {merchantInfo && (
          <>
            {/* Inventory */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-xl bg-muted p-3">
                    <Boxes className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Stock Quantity
                    </p>

                    <p className="text-2xl font-bold">{product.stockQty}</p>
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

                    <p className="text-2xl font-bold">
                      {product.orderItems?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-xl bg-muted p-3">
                    <Package className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Inventory Value
                    </p>

                    <p className="text-2xl font-bold">
                      {product.currency} {inventoryValue.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>

                  <p className="font-medium">
                    {new Date(product.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Updated At</p>

                  <p className="font-medium">
                    {new Date(product.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
