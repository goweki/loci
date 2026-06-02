// "use client";

// import * as React from "react";
// import { Button, buttonVariants } from "@/components/ui/button";
// import { useEffect, useState, useRef } from "react";
// import {
//   NavigationMenu,
//   NavigationMenuItem,
//   NavigationMenuList,
// } from "@/components/ui/navigation-menu";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { cn } from "@/lib/utils";
// import { BrandSymbol } from "./brand";
// import { MenuIcon } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import ThemeToggle from "./themeToggle";
// import LanguageToggle from "./language-toggle";
// import { usePathname } from "next/navigation";
// import { homePages, languages, useI18n } from "@/lib/i18n";
// import UserMenu from "../dashboard/user-menu";

// const translations = {
//   en: {
//     signInText: "Sign In",
//     ctaText: "Get Started",
//   },
//   sw: {
//     signInText: "Ingia",
//     ctaText: "Jiunge na Loci",
//   },
// };

// // Types
// export interface NavbarNavLink {
//   href: string;
//   label: string;
//   active?: boolean;
// }

// export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
//   logo?: React.ReactNode;
//   logoHref?: string;
//   navigationLinks?: NavbarNavLink[];
//   authenticated?: boolean;
//   signInHref?: string;
//   ctaHref?: string;
// }

// // Default navigation links
// const defaultNavigationLinks: NavbarNavLink[] = [
//   { href: "/", label: "Home" },
//   { href: "/pricing", label: "Pricing" },
// ];

// export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
//   (
//     {
//       className,
//       logo = (
//         <>
//           <BrandSymbol height={24} />
//           <span className="hidden font-bold text-primary text-xl md:inline-block">
//             LOCi
//           </span>
//         </>
//       ),
//       logoHref = "/",
//       navigationLinks = defaultNavigationLinks,
//       signInHref = "/sign-in",
//       ctaHref = "/sign-up",
//       authenticated = false,
//       ...props
//     },
//     ref,
//   ) => {
//     const [isMobile, setIsMobile] = useState(false);
//     const [isVisible, setIsVisible] = useState<boolean>(true);
//     const containerRef = useRef<HTMLElement>(null);
//     const pathname = usePathname();
//     const { language } = useI18n();
//     const t = translations[language];

//     const isActive = (href: string): boolean => {
//       if (href === "/") {
//         return pathname === "/" || homePages.includes(pathname);
//       }

//       if (pathname.endsWith(href)) {
//         return true;
//       }

//       for (const prefix of homePages) {
//         if (
//           pathname.startsWith(prefix) &&
//           pathname.substring(prefix.length).startsWith(href)
//         ) {
//           return true;
//         }
//       }

//       return false;
//     };

//     useEffect(() => {
//       const checkWidth = () => {
//         if (containerRef.current) {
//           const width = containerRef.current.offsetWidth;
//           setIsMobile(width < 768); // 768px is md breakpoint
//         }
//       };

//       checkWidth();

//       const resizeObserver = new ResizeObserver(checkWidth);
//       if (containerRef.current) {
//         resizeObserver.observe(containerRef.current);
//       }

//       return () => {
//         resizeObserver.disconnect();
//       };
//     }, []);

//     useEffect(() => {
//       let lastScrollY = window.scrollY;

//       function controllNavBar() {
//         const currentScrollY = window.scrollY;

//         if (currentScrollY > lastScrollY && currentScrollY > 100) {
//           setIsVisible(false);
//         } else {
//           setIsVisible(true);
//         }
//         lastScrollY = currentScrollY;
//       }

//       window.addEventListener("scroll", controllNavBar);

//       return () => {
//         window.removeEventListener("scroll", controllNavBar);
//       };
//     }, []);

//     // Combine refs
//     const combinedRef = React.useCallback(
//       (node: HTMLElement | null) => {
//         containerRef.current = node;
//         if (typeof ref === "function") {
//           ref(node);
//         } else if (ref) {
//           ref.current = node;
//         }
//       },
//       [ref],
//     );

//     return (
//       <header
//         ref={combinedRef}
//         className={cn(
//           "fixed top-0 z-40 w-full border-b bg-popover/50 text-popover-foreground backdrop-blur px-4 md:px-6 [&_*]:no-underline transition-transform duration-300",
//           className,
//           isVisible ? "translate-y-0" : "-translate-y-full",
//         )}
//         {...props}
//       >
//         <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4">
//           {/* Left side */}
//           <div className="flex items-center gap-2">
//             {/* Mobile menu trigger */}
//             {isMobile && (
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
//                     variant="ghost"
//                     size="icon"
//                   >
//                     <MenuIcon />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent align="start" className="w-48 p-2">
//                   <NavigationMenu className="max-w-none">
//                     <NavigationMenuList className="flex-col items-start gap-1">
//                       {navigationLinks.map((link, index) => (
//                         <NavigationMenuItem key={index} className="w-full">
//                           <Link
//                             href={link.href}
//                             className={cn(
//                               buttonVariants({ variant: "ghost" }),
//                               isActive(link.href)
//                                 ? "bg-accent text-accent-foreground"
//                                 : "text-foreground/80",
//                             )}
//                           >
//                             {link.label}
//                           </Link>
//                         </NavigationMenuItem>
//                       ))}
//                     </NavigationMenuList>
//                   </NavigationMenu>
//                 </PopoverContent>
//               </Popover>
//             )}
//             {/* Main nav */}
//             <div className="flex items-center gap-6">
//               <Link
//                 href={logoHref}
//                 className="flex items-center space-x-2 hover:text-primary/90 transition-colors cursor-pointer"
//               >
//                 {logo}
//               </Link>
//               {/* Navigation menu */}
//               {!isMobile && (
//                 <NavigationMenu className="flex">
//                   <NavigationMenuList className="gap-1">
//                     {navigationLinks.map((link, index) => (
//                       <NavigationMenuItem key={index}>
//                         <Link
//                           href={link.href}
//                           className={cn(
//                             buttonVariants({ variant: "ghost" }),
//                             isActive(link.href)
//                               ? "bg-accent text-accent-foreground"
//                               : "",
//                           )}
//                         >
//                           {link.label}
//                         </Link>
//                       </NavigationMenuItem>
//                     ))}
//                   </NavigationMenuList>
//                 </NavigationMenu>
//               )}
//             </div>
//           </div>
//           {/* Right side */}
//           <div className="flex items-center gap-3">
//             <LanguageToggle />
//             <ThemeToggle variant="outline" />
//             {authenticated ? (
//               <UserMenu />
//             ) : (
//               <>
//                 <Link
//                   href={"/" + language + signInHref}
//                   className={cn(buttonVariants({ variant: "outline" }))}
//                 >
//                   {t.signInText}
//                 </Link>
//                 {/* <Link
//                   href={"/" + language + ctaHref}
//                   className={cn(buttonVariants({ variant: "default" }))}
//                 >
//                   {t.ctaText}
//                 </Link> */}
//               </>
//             )}
//           </div>
//         </div>
//       </header>
//     );
//   },
// );

// Navbar.displayName = "Navbar";

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
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    icon?: LucideIcon;
    title: string;
  }
>(({ className, title, children, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function RichNavigationMenu({ navigation, className }: RichNavMenuProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
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
  navigationLinks?: RichNavMenuProps["navigation"];
  authenticated?: boolean;
  ctaHref?: string;
}

// Default navigation links
const navUnauth: RichNavMenuProps["navigation"] = [
  { href: "/", label: "Home", type: "link" },
  { href: "/contact-us", label: "Contact Us", type: "link" },
];

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = (
        <>
          <BrandSymbol height={24} />
          <span className="hidden font-bold text-foreground text-xl md:inline-block">
            Sync
          </span>
        </>
      ),
      logoHref = "/",
      navigationLinks = navUnauth,
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
