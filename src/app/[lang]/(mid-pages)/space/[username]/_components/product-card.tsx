"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MerchantProduct } from "./space-utils";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

type Props = {
  product: MerchantProduct;
};

export function ProductCard({ product }: Props) {
  const { language } = useI18n();
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={200}
            height={200}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No Image
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <h3 className="line-clamp-2 text-lg font-semibold">{product.name}</h3>

        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-xl font-bold">
          {product.currency} {Number(product.price).toLocaleString()}
        </p>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/${language}/product/${product.id}`}>
            View Product
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
