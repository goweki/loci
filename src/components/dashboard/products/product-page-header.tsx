"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ProductPageHeader() {
  const { language } = useI18n();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>

        <p className="text-muted-foreground">
          Manage your inventory and pricing
        </p>
      </div>

      <Button asChild>
        <Link href={`/${language}/dashboard/products/create`}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Link>
      </Button>
    </div>
  );
}
