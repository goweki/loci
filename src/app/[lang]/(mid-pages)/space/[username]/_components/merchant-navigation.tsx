import Link from "next/link";

import { Info, Package } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

type Props = {
  username: string;
};

export function MerchantNavigation({ username }: Props) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/space/${username}`}
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
