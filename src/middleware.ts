// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/forgot-password"];

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/webhooks"];

// static assets / special paths to skip middleware
const IGNORE_PATHS = [
  "/_next", // Next.js build files
  "/favicon.ico", // Favicon
  "/assets", // Public assets
  "/images", // Public images
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignore Next.js internals & static files
  if (IGNORE_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Public routes (exact match)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Public API routes (prefix match)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 4. Get token from cookies
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Verify token
  const payload = verifyJWT(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 6. Attach user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

// Matcher: apply middleware only to certain routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|images).*)"],
};
