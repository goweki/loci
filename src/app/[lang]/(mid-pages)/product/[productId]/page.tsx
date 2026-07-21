import { getProductById } from "@/actions/product.actions";
import { notFound } from "next/navigation";
import ProductViewComponent from "@/components/dashboard/products/product-view";

type Props = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;

  const resProduct = await getProductById(productId);

  if (!resProduct.ok) {
    notFound();
  }

  const product = resProduct.data;

  return <ProductViewComponent product={product} />;
}
