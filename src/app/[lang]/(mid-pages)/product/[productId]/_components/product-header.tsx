import { BoxIcon, MessageCircle, Package, Phone, Store } from "lucide-react";
import { ProductWithRelations } from "@/services/commerce/product.service";
import TitleSection from "@/components/ui/page-title";
import { ShareLinkDialog } from "@/components/dashboard/products/product-view/share-dialog";
import { BASE_URL } from "@/lib/utils/getUrl";

type Props = {
  lang: string;
  product: ProductWithRelations;
};

export async function ProductHeader({ lang, product }: Props) {
  const merchant = product.user;

  return (
    <div className="flex items-center gap-4">
      <TitleSection
        title={product.name}
        subtitle={` by ${merchant.username}`}
        icon={BoxIcon}
        //   description={`${booking.scheduledDate} · ${booking.timeSlotStart} · ${booking.totalTonnage} T total`}
        breadcrumbs={[
          {
            label: `${merchant.username}`,
            href: `/${lang}/space/${merchant.username}`,
          },
          { label: product.name },
        ]}
      />

      <div className="flex gap-2">
        <ShareLinkDialog
          product={JSON.parse(JSON.stringify(product))}
          link={`${BASE_URL}/en/product/${product.id}`}
        />
      </div>
    </div>
  );
}
