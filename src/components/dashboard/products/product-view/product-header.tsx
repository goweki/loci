"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ProductWithRelations } from "@/services/commerce/product.service";

import { ShareLinkDialog } from "./share-dialog";
import { ProductActions } from "./product-actions";

interface ProductHeaderProps {
  product: ProductWithRelations;
  merchantInfo?: boolean;
}

export default function ProductHeader({
  product,
  merchantInfo = false,
}: ProductHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      {/* Left */}
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="w-fit px-0">
          <Link href="/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-2">
            {product.sku && <Badge variant="outline">SKU: {product.sku}</Badge>}

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

            <Badge variant="secondary">
              {product.currency} {Number(product.price).toLocaleString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center gap-2">
        <ShareLinkDialog product={product} />

        {merchantInfo && <ProductActions product={product} />}
      </div>
    </div>
  );
}
