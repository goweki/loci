import Link from "next/link";

import { Info, Package } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ProductWithRelations } from "@/services/commerce/product.service";

type Props = {
  product: ProductWithRelations;
};

export function ProductNavigation({ product }: Props) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/product/${product.id}`}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Products
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/space/${username}/about`}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              About
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem> */}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
