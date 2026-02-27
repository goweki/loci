import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LAUNCH_DATE = new Date("2026-04-01T00:00:00Z");
const DEFAULT_LOCALE = "en";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = new Date();

  // 1. Root Redirect (Always active)
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url));
  }

  // 2. Production-only "Coming Soon" Rewrite
  if (IS_PRODUCTION && now < LAUNCH_DATE) {
    const isApiOrStatic =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes("/coming-soon"); // Avoid redirect loop

    if (!isApiOrStatic) {
      const url = request.nextUrl.clone();
      const locale = pathname.split("/")[1] || DEFAULT_LOCALE;

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
