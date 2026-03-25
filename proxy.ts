import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "shiftpilot_session";
const protectedPrefixes = [
  "/dashboard",
  "/ai-shift",
  "/multi-store",
  "/shifts",
  "/requests",
  "/leave-control",
  "/leave-balance",
  "/labor-cost",
  "/staff",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isProtectedPath =
    pathname === "/" || protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/ai-shift/:path*",
    "/multi-store/:path*",
    "/shifts/:path*",
    "/requests/:path*",
    "/leave-control/:path*",
    "/leave-balance/:path*",
    "/labor-cost/:path*",
    "/staff/:path*",
  ],
};
