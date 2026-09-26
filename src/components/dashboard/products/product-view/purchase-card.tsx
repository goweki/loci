"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { createMarketplaceCheckoutAction } from "@/actions/marketplace.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductWithRelations } from "@/services/commerce/product.service";

interface PurchaseCardProps {
  product: ProductWithRelations;
  canPurchase?: boolean;
  lang?: string;
}

export default function PurchaseCard({
  product,
  canPurchase = true,
  lang = "en",
}: PurchaseCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const total = quantity * Number(product.price);
  const merchantTel = product.user?.tel;
  const merchantEmail = product.user?.email;
  const whatsappUrl = merchantTel
    ? `https://wa.me/${merchantTel.replace(/\D/g, "")}`
    : undefined;

  const contactMerchant = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } else if (merchantEmail) {
      window.location.href = `mailto:${merchantEmail}`;
    } else {
      toast("Contact details are not available for this merchant.");
    }
  };

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsProcessing(true);

    try {
      const result = await createMarketplaceCheckoutAction({
        productId: product.id,
        quantity,
        buyerName,
        buyerEmail,
        buyerPhone: buyerPhone || undefined,
        lang,
      });

      if (!result.ok) {
        toast.error(result.error);
        setIsProcessing(false);
        return;
      }

      window.location.assign(result.data.authorizationUrl);
    } catch {
      toast.error("Unable to start checkout. Please try again.");
      setIsProcessing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
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

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="purchase-quantity">Quantity</Label>
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={!canPurchase || quantity <= 1}
            >
              <Minus />
            </Button>
            <span
              id="purchase-quantity"
              className="w-10 text-center font-semibold"
            >
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Increase quantity"
              onClick={() =>
                setQuantity((current) =>
                  Math.min(product.stockQty, current + 1),
                )
              }
              disabled={!canPurchase || quantity >= product.stockQty}
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="rounded-md bg-muted p-4">
          <p className="text-sm text-muted-foreground">Order total</p>
          <p className="text-2xl font-bold">
            {product.currency} {total.toLocaleString()}
          </p>
        </div>

        {!canPurchase ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This merchant is not currently enabled for online payments.
            </p>
            <Button className="w-full" onClick={contactMerchant}>
              Contact Merchant
            </Button>
          </div>
        ) : product.stockQty < 1 ? (
          <p className="text-sm font-medium text-destructive">Out of stock</p>
        ) : (
          <form className="space-y-4" onSubmit={submitCheckout}>
            <div className="space-y-2">
              <Label htmlFor="buyer-name">Your name</Label>
              <Input
                id="buyer-name"
                autoComplete="name"
                maxLength={120}
                required
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer-email">Email for your receipt</Label>
              <Input
                id="buyer-email"
                type="email"
                autoComplete="email"
                required
                value={buyerEmail}
                onChange={(event) => setBuyerEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer-phone">Phone number</Label>
              <Input
                id="buyer-phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={buyerPhone}
                onChange={(event) => setBuyerPhone(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={isProcessing || product.stockQty < 1}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {isProcessing ? "Starting checkout..." : "Pay with Paystack"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
