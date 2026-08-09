"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import ThemeToggle from "./themeToggle";
import UserMenu from "../dashboard/user-menu";
import { BrandSymbol } from "./brand";
import { MobileHamburgerMenu } from "./navigation-menu-hamburger";
import { LucideIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import LanguageToggle from "./language-toggle";

export type RichNavItem = {
  title: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
};

export type RichNavMenuProps = {
  navigation: Array<
    | {
        type: "mega";
        label: string;
        left: {
          title: string;
          items: RichNavItem[];
          columns?: number; // default 2
        };
        right?: {
          title: string;
          items: RichNavItem[];
        };
        widthClassName?: string; // e.g. "w-225"
      }
    | {
        type: "grid";
        label: string;
        title?: string;
        items: RichNavItem[];
        widthClassName?: string; // e.g. "w-[600px]"
        columnsClassName?: string; // e.g. "md:grid-cols-2"
      }
    | {
        type: "link";
        label: string;
        href: string;
      }
  >;
  className?: string;
};

const ListItem = React.forwardRef<
  React.ComponentRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & {
    icon?: LucideIcon;
    title: string;
    isActive?: boolean;
  }
>(({ className, title, children, icon: Icon, isActive, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground font-medium",
            className,
          )}
          ref={ref}
          {...props}
        >
          <div className="flex items-center gap-2 font-semibold leading-none tracking-tight">
            {Icon ? <Icon className="h-5 w-5" /> : null}
            {title}
          </div>

          {children ? (
            <p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-snug">
              {children}
            </p>
          ) : null}
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function RichNavigationMenu({ navigation, className }: RichNavMenuProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Standardize paths by stripping trailing slashes
    const currentPath = pathname.replace(/\/$/, "") || "/";
    const targetPath = href.replace(/\/$/, "") || "/";

    // Split segments to safely identify the language prefix (e.g., /en or /es)
    const segments = currentPath.split("/").filter(Boolean);
    const isRootLangPath = targetPath.split("/").filter(Boolean).length === 1;

    // Exact match for root language route (e.g., /en)
    if (isRootLangPath) {
      return currentPath === targetPath;
    }

    // Exact match or sub-route match for child routes (e.g., /en/pricing or /en/pricing/enterprise)
    return (
      currentPath === targetPath || currentPath.startsWith(targetPath + "/")
    );
  };

  return (
    <NavigationMenu className={cn("z-20 max-w-7xl mx-auto", className)}>
      <NavigationMenuList>
        {navigation.map((navItem) => {
          // -----------------------------
          // LINK ITEM
          // -----------------------------
          if (navItem.type === "link") {
            return (
              <NavigationMenuItem key={navItem.label}>
                <NavigationMenuLink asChild>
                  <Link
                    href={navItem.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-full justify-start",
                      isActive(navItem.href)
                        ? "bg-accent text-accent-foreground"
                        : "",
                    )}
                  >
                    {navItem.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          // -----------------------------
          // MEGA MENU
          // -----------------------------
          if (navItem.type === "mega") {
            const leftCols = navItem.left.columns ?? 2;

            return (
              <NavigationMenuItem key={navItem.label}>
                <NavigationMenuTrigger>{navItem.label}</NavigationMenuTrigger>

                <NavigationMenuContent className="px-0 py-1">
                  <div
                    className={cn(
                      "grid grid-cols-3 gap-3 divide-x p-4",
                      navItem.widthClassName ?? "w-225",
                    )}
                  >
                    {/* Left side */}
                    <div className="col-span-2">
                      <h6 className="pl-2.5 font-semibold text-muted-foreground text-sm uppercase">
                        {navItem.left.title}
                      </h6>

                      <ul
                        className={cn(
                          "mt-2.5 grid gap-3",
                          leftCols === 1 ? "grid-cols-1" : "grid-cols-2",
                        )}
                      >
                        {navItem.left.items.map((item) => (
                          <ListItem
                            key={`${navItem.label}-${item.title}`}
                            href={item.href}
                            title={item.title}
                            icon={item.icon}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </div>

                    {/* Right side */}
                    {navItem.right ? (
                      <div className="pl-4">
                        <h6 className="pl-2.5 font-semibold text-muted-foreground text-sm uppercase">
                          {navItem.right.title}
                        </h6>

                        <ul className="mt-2.5 grid gap-3">
                          {navItem.right.items.map((item) => (
                            <ListItem
                              key={`${navItem.label}-right-${item.title}`}
                              href={item.href}
                              title={item.title}
                              icon={item.icon}
                            >
                              {item.description}
                            </ListItem>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          // -----------------------------
          // GRID MENU
          // -----------------------------
          if (navItem.type === "grid") {
            return (
              <NavigationMenuItem key={navItem.label}>
                <NavigationMenuTrigger>{navItem.label}</NavigationMenuTrigger>

                <NavigationMenuContent className="p-4">
                  <h6 className="pl-2.5 font-semibold text-muted-foreground text-sm uppercase">
                    {navItem.title ?? navItem.label}
                  </h6>

                  <ul
                    className={cn(
                      "mt-2.5 grid gap-3",
                      navItem.widthClassName ??
                        "w-[400px] md:w-[500px] lg:w-[600px]",
                      navItem.columnsClassName ?? "md:grid-cols-2",
                    )}
                  >
                    {navItem.items.map((item) => (
                      <ListItem
                        key={`${navItem.label}-${item.title}`}
                        href={item.href}
                        title={item.title}
                        icon={item.icon}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return null;
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks: RichNavMenuProps["navigation"];
  authenticated?: boolean;
  ctaHref?: string;
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = (
        <>
          <BrandSymbol height={24} />
          <span className="hidden font-bold opacity-50 text-foreground text-xl md:inline-block">
            loci
          </span>
        </>
      ),
      logoHref = "/",
      navigationLinks,
      ctaHref = "/sign-in",
      authenticated = false,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const containerRef = React.useRef<HTMLElement | null>(null);

    // Expose internal ref to parent safely (fixes TS read-only ref.current issue)
    React.useImperativeHandle(ref, () => containerRef.current as HTMLElement);

    React.useEffect(() => {
      let lastScrollY = window.scrollY;

      const controlNavBar = () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }

        lastScrollY = currentScrollY;
      };

      window.addEventListener("scroll", controlNavBar, { passive: true });

      return () => {
        window.removeEventListener("scroll", controlNavBar);
      };
    }, []);

    return (
      <header
        ref={containerRef}
        className={cn(
          "fixed top-0 z-40 w-full border-b bg-popover/50 text-popover-foreground backdrop-blur px-4 md:px-6 [&_*]:no-underline transition-transform duration-300",
          isVisible ? "translate-y-0" : "-translate-y-full",
          className,
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <MobileHamburgerMenu navigation={navigationLinks} />
            </div>

            {/* Brand + Desktop nav */}
            <div className="flex items-center gap-6">
              <Link
                href={logoHref}
                className="flex items-center space-x-2 hover:text-primary/90 transition-colors cursor-pointer"
              >
                {logo}
              </Link>

              {/* Desktop navigation */}
              <div className="hidden md:block">
                <RichNavigationMenu navigation={navigationLinks} />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageToggle />

            <ThemeToggle variant="outline" />

            {authenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  href={ctaHref}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Sign In
                </Link>

                {/* Optional CTA */}
                {/* <Link
                  href={ctaHref}
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Get Started
                </Link> */}
              </>
            )}
          </div>
        </div>
      </header>
    );
  },
);

Navbar.displayName = "Navbar";
