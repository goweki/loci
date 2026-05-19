import { ProductGrid } from "@/components/dashboard/products/product-grid";
import { ProductPageHeader } from "@/components/dashboard/products/product-page-header";
import { ProductStats } from "@/components/dashboard/products/product-stats";
import { ProductEmptyState } from "@/components/dashboard/products/product-empty-state";
import { getUserProducts } from "@/actions/product.actions";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
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
