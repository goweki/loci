"use client";

import { BoxIcon, MessageCircle, Package, Phone, Store } from "lucide-react";
import { ProductWithRelations } from "@/services/commerce/product.service";
import TitleSection from "@/components/ui/page-title";
import { ShareLinkDialog } from "@/components/dashboard/products/product-view/share-dialog";
import { useI18n } from "@/lib/i18n";

type Props = {
  product: ProductWithRelations;
};

export function ProductHeader({ product }: Props) {
  const { language } = useI18n();
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
            href: `/${language}/space/${merchant.username}`,
          },
          { label: product.name },
        ]}
      />

      <div className="flex gap-2">
        <ShareLinkDialog
          // product={product}
          product={JSON.parse(JSON.stringify(product))}
        />
      </div>
    </div>
  );
}
