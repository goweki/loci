import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { Separator } from "@/components/ui/separator";

import { ProductHeader } from "./_components/product-header";
import { ProductNavigation } from "./_components/product-navigation";
import { getMerchantSpaceAction } from "@/actions/space.actions";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getProductById } from "@/actions/product.actions";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{
    productId: string;
  }>;
};

export default async function ProductLayout({ children, params }: LayoutProps) {
  const { productId } = await params;

  const productRes = await getProductById(productId);

  if (!productRes.ok) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive animate-in fade-in zoom-in-95 duration-300">
          <AlertCircleIcon className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>

        <p className="text-sm text-muted-foreground max-w-md">
          {productRes.error ||
            "We couldn't load this product. Please try again later."}
        </p>

        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const product = productRes.data;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <ProductHeader product={product} />

      <ProductNavigation product={product} />

      <main>{children}</main>
    </div>
  );
}
