// // middleware.ts (root or /src)

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   if (pathname === "/") {
//     return NextResponse.redirect(new URL("/en", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/"],
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. Define constants outside the function to avoid re-allocation
const LAUNCH_DATE = new Date("2026-04-01T00:00:00Z");
const DEFAULT_LOCALE = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = new Date();

  // 2. Handle the Root Redirect (Your current logic)
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url));
  }

  // 3. Launch Date Logic
  // If we haven't launched yet, we "rewrite" the request.
  // Rewriting is better than Redirecting because the URL in the browser
  // stays clean (e.g., /en) but the server shows the Coming Soon content.
  if (now < LAUNCH_DATE) {
    // Only intercept page routes, skip internal Next.js paths
    const isApiOrStatic =
      pathname.startsWith("/_next") || pathname.startsWith("/api");

    if (!isApiOrStatic) {
      // Logic: If not launched, internally map to a 'coming-soon' segment
      // Note: You must have a page at /app/[lang]/coming-soon/page.tsx
      const url = request.nextUrl.clone();

      // Extract locale from path (e.g., /en/dashboard -> en)
      const locale = pathname.split("/")[1] || DEFAULT_LOCALE;

      // Optional: If you want the whole site to show 'Coming Soon'
      // regardless of the sub-page they try to visit:
      url.pathname = `/${locale}/coming-soon`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// 4. Optimized Matcher
// This excludes static files and images so the middleware doesn't slow down asset loading
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
