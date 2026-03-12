import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to protect /dashboard routes.
 * Checks for a session cookie — if missing, redirects to /login.
 *
 * Note: This only checks that the cookie EXISTS, not that it's valid.
 * Full JWT verification happens in `getSession()` / `requireSession()` on the server.
 * This keeps middleware fast (no crypto on every request).
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");

  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
