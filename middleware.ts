import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "aos_session";
const PUBLIC_PREFIXES = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Expose the path to the root layout so it can pick the right chrome.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!isPublic && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on everything except static assets & Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
