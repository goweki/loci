import { ProductCard } from "./product-card";
import { ProductWithRelations } from "@/services/commerce/product.service";

interface Props {
  products: ProductWithRelations[];
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
