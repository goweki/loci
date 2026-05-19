"use client";

import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent } from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { createProductAction } from "@/actions/product.actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

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

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const name = String(formData.get("name"));
      const price = Number(formData.get("price"));
      const stockQty = Number(formData.get("stockQty"));

      if (!name || !price) {
        toast.error(`MISSING: ${!name ? "product name" : "price"}`);
        return;
      }

      const resProduct = await createProductAction({
        name,
        price,
        stockQty,
      });

      if (!resProduct.ok) {
        toast.error(resProduct.error);
        return;
      }

      toast.success("Product created");
      router.push(`/${language}/dashboard/products/${resProduct.data.id}`);
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Name</Label>

            <Input name="name" defaultValue={defaultValues?.name} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Price</Label>

              <Input
                name="price"
                type="number"
                defaultValue={defaultValues?.price}
                required
              />
            </div>
          </div>

          <Button disabled={isPending} className="w-full">
            {isPending ? "Loading..." : "Save Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
