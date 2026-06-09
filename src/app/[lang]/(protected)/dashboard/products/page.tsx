import { ProductGrid } from "@/components/__dashboard/products/product-grid";
import { ProductStats } from "@/components/__dashboard/products/product-stats";
import { ProductEmptyState } from "@/components/__dashboard/products/product-empty-state";
import { getUserProducts } from "@/actions/product.actions";
import PageTitle from "@/components/ui/page-title";
import { isValidLanguage } from "@/lib/i18n";
import { PackageIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

const translations = {
  en: {
    title: "Products",
    description: "Your Products",
  },

  sw: {
    title: "Bidhaa",
    description: "Bidhaa zako",
  },
};

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) return;
  const t = translations[lang];

  const resProducts = await getUserProducts();

  if (!resProducts.ok) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
          {resProducts.error}
        </div>
      </div>
    );
  }

  const products = resProducts.data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <PageTitle
          icon={PackageIcon}
          title={t.title}
          subtitle={products.length.toString() || undefined}
          description={t.description}
        />
        <Link
          href={`/${lang}/dashboard/products/create`}
          className={buttonVariants({ variant: "default" })}
        >
          New Product
        </Link>
      </div>

      <ProductStats products={products} />

      {products.length === 0 ? (
        <ProductEmptyState />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
