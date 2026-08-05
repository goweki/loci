"use client";

import { Calendar, Clock, Hash } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface ProductMetadataProps {
  product: ProductWithRelations;
}

export default function ProductMetadata({ product }: ProductMetadataProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />

          <div>
            <p className="text-sm text-muted-foreground">Created</p>

            <p className="font-medium">
              {new Date(product.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />

          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>

            <p className="font-medium">
              {new Date(product.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <Hash className="mt-0.5 h-5 w-5 text-muted-foreground" />

          <div>
            <p className="text-sm text-muted-foreground">Product ID</p>

            <p className="break-all font-mono text-sm">{product.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
