"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus, ShoppingCart, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface PurchaseCardProps {
  product: ProductWithRelations;
}

export default function PurchaseCard({ product }: PurchaseCardProps) {
  const [quantity, setQuantity] = useState(1);

  const increment = () => {
    if (quantity < product.stockQty) {
      setQuantity((q) => q + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const total = quantity * Number(product.price);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Unit Price</p>

          <p className="text-3xl font-bold">
            {product.currency} {Number(product.price).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Available Stock</p>

          <p className="font-medium">
            {product.stockQty.toLocaleString()} units
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Quantity</p>

          <div className="flex w-fit items-center rounded-lg border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={decrement}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="w-16 text-center font-semibold">{quantity}</div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={increment}
              disabled={quantity >= product.stockQty}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Total</p>

          <p className="text-2xl font-bold">
            {product.currency} {total.toLocaleString()}
          </p>
        </div>

        <div className="grid gap-3">
          <Button onClick={() => toast("Add to Cart coming soon.")}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>

          <Button
            variant="secondary"
            onClick={() => toast("Checkout coming soon.")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
