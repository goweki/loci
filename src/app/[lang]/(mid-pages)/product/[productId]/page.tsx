import { getPublicProductById } from "@/actions/product.actions";
import {
  getLociSubscriptionStatusByUserId,
  canMerchantSell,
} from "@/data/subscription";
import { notFound } from "next/navigation";
import ProductViewComponent from "@/components/dashboard/products/product-view";
import { BASE_URL } from "@/lib/utils/getUrl";
import TitleSection from "@/components/ui/page-title";
import {
  ArrowLeftIcon,
  BoxIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import { ShareLinkDialog } from "@/components/dashboard/products/product-view/share-dialog";
import { ProductHeader } from "./_components/product-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  const monetizationStatus = await getLociSubscriptionStatusByUserId(
    product.user.username,
  );
  const canPurchase = await canMerchantSell(monetizationStatus);
  // const shareLink = `${BASE_URL}/en/product/${product.id}`;

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
