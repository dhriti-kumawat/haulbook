import { NextRequest, NextResponse } from "next/server";

/**
 * Blocks cross-site requests that change data: a POST/PATCH/DELETE to our API must come from our
 * own pages. (Session cookies are SameSite=Lax already; this is a second, explicit check.)
 * NextAuth's own routes do their own CSRF checks, and the cron job is called by Vercel with a secret.
 */
export function middleware(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/auth/") && !/^\/api\/auth\/(signup|forgot|reset|phone)$/.test(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();

  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    if (new URL(origin).host !== host) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
