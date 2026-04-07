import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE } from "@/lib/auth-constants";

const protectedPrefixes = ["/dashboard", "/documents", "/chat", "/history", "/settings"];

const authRoutes = ["/login", "/signup"];

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(AUTH_SESSION_COOKIE)?.value === "1";

  if (isProtectedPath(pathname) && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (authRoutes.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/documents",
    "/documents/:path*",
    "/chat",
    "/chat/:path*",
    "/history",
    "/history/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
