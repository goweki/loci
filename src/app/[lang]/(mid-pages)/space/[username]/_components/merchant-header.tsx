import Link from "next/link";

import { MessageCircle, Package, Phone, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MerchantSpaceData } from "@/actions/space.dto";

type Props = {
  merchant: MerchantSpaceData;
};

export function MerchantHeader({ merchant }: Props) {
  const whatsappUrl = merchant.tel
    ? `https://wa.me/${merchant.tel.replace(/\D/g, "")}`
    : null;

  const smsUrl = merchant.tel ? `sms:${merchant.tel}` : null;

  const initials = merchant.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={merchant.image ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{merchant.name}</h1>

            <Badge variant="secondary">
              <Store className="mr-1 h-3 w-3" />
              Merchant
            </Badge>
          </div>

          <p className="text-muted-foreground">@{merchant.username}</p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />

            <span>
              {merchant.productCount}{" "}
              {merchant.productCount === 1 ? "Product" : "Products"}
            </span>
          </div>
        </div>
      </div>

      {merchant.tel && (
        <div className="flex flex-wrap gap-3">
          {whatsappUrl && (
            <Button asChild>
              <Link href={whatsappUrl}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Link>
            </Button>
          )}

          {smsUrl && (
            <Button asChild variant="outline">
              <Link href={smsUrl}>
                <Phone className="mr-2 h-4 w-4" />
                SMS
              </Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
