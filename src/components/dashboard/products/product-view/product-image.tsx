"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface ProductImageProps {
  product: ProductWithRelations;
}

export default function ProductImage({ product }: ProductImageProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageIcon className="h-14 w-14" />
              <p className="text-sm">No product image available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
