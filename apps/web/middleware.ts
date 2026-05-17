import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/borrower") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/sanction") ||
    pathname.startsWith("/disbursement") ||
    pathname.startsWith("/collection");

  const isRoot = pathname === "/";
  const isLogin = pathname === "/login";

  // If user is on root or login and already has auth, redirect to dashboard
  const hasAuthCookie = request.cookies.has("accessToken");
  const hasRefreshCookie = request.cookies.has("refreshToken");
  if ((isRoot || isLogin) && (hasAuthCookie || hasRefreshCookie)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!protectedRoute) return NextResponse.next();

  // If neither access nor refresh cookie present, redirect to login.
  // If refresh exists but access is missing, allow the request so the client
  // can attempt a server-side refresh flow and restore the session.
  if (!hasAuthCookie && !hasRefreshCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/borrower/:path*", "/sales/:path*", "/sanction/:path*", "/disbursement/:path*", "/collection/:path*"],
};
