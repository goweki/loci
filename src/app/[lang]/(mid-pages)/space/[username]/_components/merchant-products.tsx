import { Package } from "lucide-react";
import { ProductCard } from "./product-card";
import { MerchantProduct } from "./space-utils";

type Props = {
  products: MerchantProduct[];
};

export function MerchantProducts({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />

        <h2 className="text-lg font-semibold">No products available</h2>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          This merchant hasn&apos;t published any products yet. Please check
          back later.
        </p>
      </div>
    );
  }

  return (
    <section
      className="
        grid
        gap-6
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={JSON.parse(JSON.stringify(product))}
        />
      ))}
    </section>
  );
}
