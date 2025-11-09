"use client";

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BrandSymbol } from "./brand";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./themeToggle";
import LanguageToggle from "./language-toggle";
import { usePathname } from "next/navigation";
import { homePages, languages, useI18n } from "@/lib/i18n";
import UserMenu from "../dashboard/user-menu";

const translations = {
  en: {
    signInText: "Sign In",
    ctaText: "Get Started",
  },
  sw: {
    signInText: "Ingia",
    ctaText: "Jiunge na Loci",
  },
};

// Types
export interface NavbarNavLink {
  href: string;
  label: string;
  active?: boolean;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: NavbarNavLink[];
  authenticated?: boolean;
  signInHref?: string;
  ctaHref?: string;
}

// Default navigation links
const defaultNavigationLinks: NavbarNavLink[] = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
];

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = <BrandSymbol />,
      logoHref = "#",
      navigationLinks = defaultNavigationLinks,
      signInHref = "/sign-in",
      ctaHref = "/sign-up",
      authenticated = false,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const containerRef = useRef<HTMLElement>(null);
    const pathname = usePathname();
    const { language } = useI18n();
    const t = translations[language];

    const isActive = (href: string): boolean => {
      if (href === "/") {
        return pathname === "/" || homePages.includes(pathname);
      }

      if (pathname.endsWith(href)) {
        return true;
      }

      for (const prefix of homePages) {
        if (
          pathname.startsWith(prefix) &&
          pathname.substring(prefix.length).startsWith(href)
        ) {
          return true;
        }
      }

      return false;
    };

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    useEffect(() => {
      let lastScrollY = window.scrollY;

      function controllNavBar() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY = currentScrollY;
      }

      window.addEventListener("scroll", controllNavBar);

      return () => {
        window.removeEventListener("scroll", controllNavBar);
      };
    }, []);

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <header
        ref={combinedRef}
        className={cn(
          "fixed top-0 z-50 w-full border-b bg-popover/50 text-popover-foreground backdrop-blur px-4 md:px-6 [&_*]:no-underline transition-transform duration-300",
          className,
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <MenuIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-2">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <Link
                            href={link.href}
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              isActive(link.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/80"
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
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center space-x-2 hover:text-primary/90 transition-colors cursor-pointer"
              >
                <Image
                  src="/brand/logo_symbol.svg"
                  alt="logo"
                  height={24}
                  width={24}
                />
                <span className="hidden font-bold text:primary text-xl md:inline-block">
                  LOCi
                </span>
              </Link>
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        <Link
                          href={link.href}
                          className={cn(
                            buttonVariants({ variant: "ghost" }),
                            isActive(link.href)
                              ? "bg-accent text-accent-foreground"
                              : ""
                          )}
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
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
                  href={"/" + language + signInHref}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  {t.signInText}
                </Link>
                <Link
                  href={"/" + language + ctaHref}
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  {t.ctaText}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Navbar.displayName = "Navbar";
