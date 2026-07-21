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
  const shareLink = `${BASE_URL}/en/product/${product.id}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <TitleSection
          title={product.name}
          subtitle=" Product details and inventory information"
          icon={BoxIcon}
          //   description={`${booking.scheduledDate} · ${booking.timeSlotStart} · ${booking.totalTonnage} T total`}
          breadcrumbs={[
            { label: "Products", href: `/${lang}/dashboard/products` },
            { label: product.name },
          ]}
        />

        <div className="flex gap-2">
          {shareLink && <ShareLinkDialog productLink={shareLink} />}
          {/* <Button onClick={() => setShowApproveDialog(true)}>
            <CheckCircle2Icon className="mr-2 h-4 w-4" /> Approve
          </Button>
          <Button onClick={() => setShowApproveDialog(true)}>
            <CheckCircle2Icon className="mr-2 h-4 w-4" /> Approve
          </Button> */}
        </div>
      </div>
      <ProductViewComponent
        product={JSON.parse(JSON.stringify(product))}
        merchantInfo
      />
    </div>
  );
}
