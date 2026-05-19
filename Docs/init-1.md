# Route Structure

```txt id="r8cjlwm"
app/
└── dashboard/
    └── products/
        ├── page.tsx
        ├── loading.tsx
        ├── error.tsx
        ├── create/
        │   └── page.tsx
        └── [productId]/
            ├── page.tsx
            └── edit/
                └── page.tsx
```

---

# Components Structure

```txt id="hsk67zq"
components/
└── dashboard/
    └── products/
        ├── product-page-header.tsx
        ├── product-stats.tsx
        ├── product-grid.tsx
        ├── product-card.tsx
        ├── product-empty-state.tsx
        ├── product-form.tsx
        ├── product-search.tsx
        ├── product-stock-badge.tsx
        ├── delete-product-dialog.tsx
        ├── product-actions-dropdown.tsx
        ├── product-table.tsx
        └── create-product-button.tsx
```

---

# `/dashboard/products/page.tsx`

```tsx id="jlwmm6"
import { requireUser } from "@/lib/auth";

import { ProductService } from "@/services/product/product.service";

import { ProductGrid } from "@/components/dashboard/products/product-grid";
import { ProductPageHeader } from "@/components/dashboard/products/product-page-header";
import { ProductStats } from "@/components/dashboard/products/product-stats";
import { ProductEmptyState } from "@/components/dashboard/products/product-empty-state";

export default async function ProductsPage() {
  const session = await requireUser();

  const products = await ProductService.getProductsByUser(session.id);

  return (
    <div className="space-y-6 p-6">
      <ProductPageHeader />

      <ProductStats products={products} />

      {products.length === 0 ? (
        <ProductEmptyState />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
```

---

# `product-page-header.tsx`

```tsx id="e2nnwq"
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";

export function ProductPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>

        <p className="text-muted-foreground">
          Manage your inventory and pricing
        </p>
      </div>

      <Button asChild>
        <Link href="/dashboard/products/create">
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Link>
      </Button>
    </div>
  );
}
```

---

# `product-grid.tsx`

```tsx id="7zh0b8"
import { Product } from "@/lib/prisma/generated";

import { ProductCard } from "./product-card";

interface Props {
  products: Product[];
}

export function ProductGrid({ products }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

# `product-card.tsx`

```tsx id="ol3jfc"
import Image from "next/image";
import Link from "next/link";

import { Product } from "@/lib/prisma/generated";

import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ProductActionsDropdown } from "./product-actions-dropdown";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={product.imageUrl ?? "/placeholder-product.jpg"}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{product.name}</h3>

            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          </div>

          <ProductActionsDropdown productId={product.id} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            KES {Number(product.price).toLocaleString()}
          </div>

          <Badge variant="secondary">{product.stockQty} in stock</Badge>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" variant="outline" asChild>
          <Link href={`/dashboard/products/${product.id}`}>View Product</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

# `product-stats.tsx`

```tsx id="0upjlwm"
import { Product } from "@/lib/prisma/generated";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  products: Product[];
}

export function ProductStats({ products }: Props) {
  const totalProducts = products.length;

  const inventoryValue = products.reduce(
    (acc, product) => acc + Number(product.price) * product.stockQty,
    0,
  );

  const lowStock = products.filter((p) => p.stockQty < 5).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Products</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">{totalProducts}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Value</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">
            KES {inventoryValue.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">{lowStock}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# `product-empty-state.tsx`

```tsx id="jlwm8n"
import Link from "next/link";

import { Package2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProductEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <div className="rounded-full bg-muted p-4">
        <Package2 className="h-10 w-10 text-muted-foreground" />
      </div>

      <h2 className="mt-4 text-2xl font-semibold">No products yet</h2>

      <p className="mt-2 max-w-md text-muted-foreground">
        Start by adding products to your inventory so you can generate invoices
        and payment links.
      </p>

      <Button className="mt-6" asChild>
        <Link href="/dashboard/products/create">Create Product</Link>
      </Button>
    </div>
  );
}
```

---

# `product-form.tsx`

```tsx id="k7ym80"
"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent } from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";

interface Props {
  defaultValues?: {
    name?: string;
    description?: string;
    price?: number;
    stockQty?: number;
    imageUrl?: string;
  };

  onSubmit: (data: any) => Promise<void>;
}

export function ProductForm({ defaultValues, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    await onSubmit({
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      stockQty: Number(formData.get("stockQty")),
      imageUrl: formData.get("imageUrl"),
    });

    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Name</Label>

            <Input name="name" defaultValue={defaultValues?.name} required />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>

            <Textarea
              name="description"
              defaultValue={defaultValues?.description}
            />
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

            <div className="space-y-2">
              <Label>Stock Quantity</Label>

              <Input
                name="stockQty"
                type="number"
                defaultValue={defaultValues?.stockQty}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image URL</Label>

            <Input name="imageUrl" defaultValue={defaultValues?.imageUrl} />
          </div>

          <Button disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

# `/dashboard/products/create/page.tsx`

```tsx id="vwjlwm"
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";

import { createProductAction } from "@/actions/product.actions";

import { ProductForm } from "@/components/dashboard/products/product-form";

export default async function CreateProductPage() {
  const session = await requireUser();

  async function handleCreate(data: any) {
    "use server";

    const res = await createProductAction({
      ...data,
      userId: session.id,
    });

    if (res.ok) {
      redirect("/dashboard/products");
    }

    throw new Error(res.error);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Product</h1>

        <p className="text-muted-foreground">Add a product to your inventory</p>
      </div>

      <ProductForm onSubmit={handleCreate} />
    </div>
  );
}
```

---

# `product-actions-dropdown.tsx`

```tsx id="8jtlqz"
"use client";

import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { MoreVertical, Pencil, Trash } from "lucide-react";

interface Props {
  productId: string;
}

export function ProductActionsDropdown({ productId }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```
