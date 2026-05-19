"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { usePathname } from "next/navigation";

export type RichNavItem = {
  title: string;
  href: string;
  description?: string;
};

export type RichNavigation =
  | {
      type: "mega";
      label: string;
      left: {
        title: string;
        items: RichNavItem[];
        columns?: number;
      };
      right?: {
        title: string;
        items: RichNavItem[];
      };
      widthClassName?: string;
    }
  | {
      type: "grid";
      label: string;
      title?: string;
      items: RichNavItem[];
      widthClassName?: string;
      columnsClassName?: string;
    }
  | {
      type: "link";
      label: string;
      href: string;
    };

export type MobileHamburgerMenuProps = {
  navigation: RichNavigation[];
  isActive?: (href: string) => boolean;
  triggerClassName?: string;
};

type FlatNavLink = {
  label: string;
  href: string;
};

function flattenNavigation(navigation: RichNavigation[]): FlatNavLink[] {
  const links: FlatNavLink[] = [];

  for (const entry of navigation) {
    if (entry.type === "link") {
      links.push({ label: entry.label, href: entry.href });
      continue;
    }

    if (entry.type === "mega") {
      // Optional: add section label as a non-click item (we skip it)
      for (const item of entry.left.items) {
        links.push({ label: item.title, href: item.href });
      }
      if (entry.right?.items?.length) {
        for (const item of entry.right.items) {
          links.push({ label: item.title, href: item.href });
        }
      }
      continue;
    }

    if (entry.type === "grid") {
      for (const item of entry.items) {
        links.push({ label: item.title, href: item.href });
      }
      continue;
    }
  }

  // remove duplicates by href (just in case)
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}

export function MobileHamburgerMenu({
  navigation,
  triggerClassName,
}: MobileHamburgerMenuProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navigationLinks = React.useMemo(
    () => flattenNavigation(navigation),
    [navigation],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", triggerClassName)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 p-2">
        <NavigationMenu className="max-w-none">
          <NavigationMenuList className="flex-col items-start gap-1">
            {navigationLinks.map((link) => (
              <NavigationMenuItem key={link.href} className="w-full">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start",
                    isActive(link.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80",
                  )}
                >
                  {link.label}
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </PopoverContent>
    </Popover>
  );
}
