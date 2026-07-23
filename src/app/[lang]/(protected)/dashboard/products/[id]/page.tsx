import { notFound } from "next/navigation";

import { getProductById } from "@/actions/product.actions";
import ProductViewComponent from "@/components/dashboard/products/product-view";
import { BASE_URL } from "@/lib/utils/getUrl";
import { ShareLinkDialog } from "@/components/dashboard/products/product-view/share-dialog";
import { BoxIcon } from "lucide-react";
import TitleSection from "@/components/ui/page-title";

interface ProductPageProps {
  params: Promise<{
    id: string;
    lang: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id, lang } = await params;

  const resProduct = await getProductById(id);

  if (!resProduct.ok) {
    notFound();
  }

  const product = resProduct.data;

  return (
    <div className="space-y-6 p-6">
      <ProductViewComponent
        product={JSON.parse(JSON.stringify(product))}
        merchantInfo
      />
    </div>
  );
}
