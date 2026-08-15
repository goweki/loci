import { getPublicProductById } from "@/actions/product.actions";
import { notFound } from "next/navigation";
import ProductViewComponent from "@/components/dashboard/products/product-view";
import { ProductHeader } from "./_components/product-header";
import prisma from "@/lib/prisma";
import { canMerchantSell } from "@/actions/merchant.actions/merchant.helpers";

type Props = {
  params: Promise<{
    productId: string;
    lang: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { productId, lang } = await params;

  const resProduct = await getPublicProductById(productId);

  if (!resProduct.ok) {
    notFound();
  }

  const product = resProduct.data;

  const merchantSubscriptions = product.user.subscriptions.map((sub) => ({
    status: sub.status,
  }));

  const canPurchase = canMerchantSell(merchantSubscriptions);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <ProductHeader product={JSON.parse(JSON.stringify(product))} />

      <ProductViewComponent
        product={JSON.parse(JSON.stringify(product))}
        canPurchase={canPurchase}
      />
    </div>
  );
}
