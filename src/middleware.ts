import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Language } from "./lib/i18n";

const LAUNCH_DATE = new Date("2026-02-01");
const DEFAULT_LOCALE = "en";
const IS_PRODUCTION: boolean =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = new Date();

  // 1. Root Redirect (Always active)
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url));
  }

  // console.log(`IS_PRODUCTION: ${IS_PRODUCTION}`);
  // console.log(`now < LAUNCH_DATE: ${now < LAUNCH_DATE}`);

  // 2. Production-only "Coming Soon" Rewrite
  if (IS_PRODUCTION && now < LAUNCH_DATE) {
    const isApiOrStatic =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes("/coming-soon"); // Avoid redirect loop

    if (!isApiOrStatic) {
      const url = request.nextUrl.clone();
      const locale = (pathname.split("/")[1] as Language) || DEFAULT_LOCALE;

      // Internally route to the coming-soon page
      url.pathname = `/${locale}/coming-soon`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
