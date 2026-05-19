import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";

import { createProductAction } from "@/actions/product.actions";

import { ProductForm } from "@/components/dashboard/products/product-form";

export default async function CreateProductPage() {
  const session = await requireUser();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Product</h1>

        <p className="text-muted-foreground">Add a product to your inventory</p>
      </div>

      <ProductForm />
    </div>
  );
}
