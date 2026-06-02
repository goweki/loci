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
