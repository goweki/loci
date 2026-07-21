import Link from "next/link";

import { MessageCircle, Package, Phone, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MerchantSpaceData } from "@/actions/space.dto";
import { Card } from "@/components/ui/card";
import { ProductWithRelations } from "@/services/commerce/product.service";

type Props = {
  product: ProductWithRelations;
};

export function ProductHeader({ product }: Props) {
  const merchant = product.user;

  const merchantTel = merchant.tel;

  const initials = product.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <Card className="w-full h-full p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={product.imageUrl ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold m-0">{product.name}</h1>

              <Badge variant="secondary">
                <Store className="mx-1 h-3 w-3" />
                Product
              </Badge>
            </div>

            <p className="text-muted-foreground">by {merchant.username}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />

              <span>
                {product.currency} {product.price}
              </span>
            </div>
          </div>
        </div>

        {/* {merchant.tel && (
          <div className="flex flex-wrap gap-3">
            {merchant && (
              <Button asChild>
                <Link href={merchant}>
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
        )} */}
      </Card>
    </section>
  );
}
