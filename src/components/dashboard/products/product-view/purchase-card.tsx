"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus, ShoppingCart, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface PurchaseCardProps {
  product: ProductWithRelations;
  canPurchase?: boolean;
}

export default function PurchaseCard({
  product,
  canPurchase = true,
}: PurchaseCardProps) {
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
  const merchantEmail = product.user?.email;
  const merchantTel = product.user?.tel;
  const whatsappUrl = merchantTel
    ? `https://wa.me/${merchantTel.replace(/\D/g, "")}`
    : undefined;

  const contactMerchant = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank");
      return;
    }

    if (merchantEmail) {
      window.location.href = `mailto:${merchantEmail}`;
      return;
    }

    toast("Contact details are not available for this merchant.");
  };

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
              disabled={!canPurchase || quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="w-16 text-center font-semibold">{quantity}</div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={increment}
              disabled={!canPurchase || quantity >= product.stockQty}
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

        {!canPurchase ? (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            This merchant is not currently able to sell directly. Contact them
            to place an order.
          </div>
        ) : null}

        <div className="grid gap-3">
          <Button
            variant={canPurchase ? "secondary" : "default"}
            onClick={() =>
              canPurchase
                ? toast("Add to Cart coming soon.")
                : contactMerchant()
            }
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {canPurchase ? "Add to Cart" : "Contact Merchant"}
          </Button>

          <Button
            variant="default"
            disabled={!canPurchase}
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
