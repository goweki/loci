import { getProductById } from "@/actions/product.actions";
import { notFound } from "next/navigation";
import ProductViewComponent from "@/components/dashboard/products/product-view";
import { BASE_URL } from "@/lib/utils/getUrl";
import TitleSection from "@/components/ui/page-title";
import { BoxIcon } from "lucide-react";
import { ShareLinkDialog } from "@/components/dashboard/products/product-view/share-dialog";

type Props = {
  params: Promise<{
    productId: string;
    lang: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { productId, lang } = await params;

  const resProduct = await getProductById(productId);

  if (!resProduct.ok) {
    notFound();
  }

  const product = resProduct.data;
  const shareLink = `${BASE_URL}/en/product/${product.id}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <TitleSection
          title={product.name}
          subtitle={` by ${product.user.username}`}
          icon={BoxIcon}
          //   description={`${booking.scheduledDate} · ${booking.timeSlotStart} · ${booking.totalTonnage} T total`}
          breadcrumbs={[
            {
              label: `${product.user.username}`,
              href: `/${lang}/space/${product.user.username}`,
            },
            { label: product.name },
          ]}
        />

        <div className="flex gap-2">
          <ShareLinkDialog product={product} />
          {/* <Button onClick={() => setShowApproveDialog(true)}>
            <CheckCircle2Icon className="mr-2 h-4 w-4" /> Approve
          </Button>
          <Button onClick={() => setShowApproveDialog(true)}>
            <CheckCircle2Icon className="mr-2 h-4 w-4" /> Approve
          </Button> */}
        </div>
      </div>
      <ProductViewComponent product={JSON.parse(JSON.stringify(product))} />
    </div>
  );
}
