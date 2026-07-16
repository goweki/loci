"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  Package,
  DollarSign,
  Layers,
  FileText,
  ImageIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { createProductAction } from "@/actions/product.actions";
import { useI18n } from "@/lib/i18n";
import InputPrice from "@/components/ui/input-currency";
import { Currency } from "@/lib/prisma/generated";

interface Props {
  defaultValues?: {
    name?: string;
    description?: string;
    price?: number;
    stockQty?: number;
    imageUrl?: string;
  };
}

export function ProductForm({ defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { language } = useI18n();

  const [price, setPrice] = useState<string>(
    defaultValues?.price ? String(defaultValues.price) : "",
  );
  const [currency, setCurrency] = useState<Currency>("USD");

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const name = String(formData.get("name") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const price = Number(formData.get("price"));
      const stockQty = Number(formData.get("stockQty"));
      const imageUrl = String(formData.get("imageUrl") || "").trim();

      // Client-side validation fallback
      if (!name || isNaN(price)) {
        toast.error(
          `Missing required fields: ${!name ? "Product Name" : "Price"}`,
        );
        return;
      }

      const resProduct = await createProductAction({
        name,
        description,
        price,
        stockQty,
      });

      if (!resProduct.ok) {
        toast.error(resProduct.error || "Something went wrong");
        return;
      }

      toast.success("Product saved successfully!");
      router.push(`/${language}/dashboard/products/${resProduct.data.id}`);
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Product Details</CardTitle>
        <CardDescription>
          Fill in the details below to configure your product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Wireless Mechanical Keyboard"
              defaultValue={defaultValues?.name}
              required
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the key features and specifications..."
              defaultValue={defaultValues?.description}
              className="min-h-24 resize-none"
              disabled={isPending}
            />
          </div>

          {/* Grid for Price and Stock */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Price */}

            <div className="space-y-2">
              <InputPrice
                id="price"
                label="Price"
                price={price}
                onPriceChange={setPrice}
                currency={currency}
                onCurrencyChange={setCurrency}
              />

              {/* Hidden inputs so standard HTML FormData still reads these values */}
              <input type="hidden" name="price" value={price} />
              <input type="hidden" name="currency" value={currency} />
            </div>

            {/* Stock Quantity */}
            <div className="space-y-2">
              <Label htmlFor="stockQty" className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Stock Quantity
              </Label>
              <Input
                id="stockQty"
                name="stockQty"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                defaultValue={defaultValues?.stockQty}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Image URL
            </Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              defaultValue={defaultValues?.imageUrl}
              disabled={isPending}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Product...
              </>
            ) : (
              "Save Product"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
