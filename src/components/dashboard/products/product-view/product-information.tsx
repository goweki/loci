"use client";

import { CheckCircle2, FileText, Package, Tag, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface ProductInformationProps {
  product: ProductWithRelations;
}

export default function ProductInformation({
  product,
}: ProductInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Product Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Product Name</span>
            </div>

            <p className="font-medium">{product.name}</p>
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span className="text-sm">SKU</span>
            </div>

            <p className="font-medium">{product.sku || "Not assigned"}</p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span className="text-sm">Price</span>
            </div>

            <p className="text-xl font-semibold">
              {product.currency} {Number(product.price).toLocaleString()}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Status</span>
            </div>

            <Badge
              variant={product.isActive ? "default" : "secondary"}
              className="gap-1"
            >
              {product.isActive ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Description</span>
          </div>

          <p className="leading-7 text-muted-foreground whitespace-pre-wrap">
            {product.description ||
              "No description has been provided for this product."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
