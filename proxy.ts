import { uncachedAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default uncachedAuth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/content") ||
    pathname.startsWith("/admin");

  if (!isProtectedRoute) return NextResponse.next();

  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { status, role } = session.user;

  if (status === "rejected" || status === "banned") {
    return NextResponse.redirect(new URL("/access-denied", nextUrl.origin));
  }

  if (status === "pending") {
    return NextResponse.redirect(new URL("/pending", nextUrl.origin));
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/content/:path*", "/admin/:path*"],
};
