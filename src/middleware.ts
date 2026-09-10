import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { DASHBOARD_SLUGS } from "./lib/clients";
import { SESSION_COOKIE } from "./lib/auth";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const slug = request.nextUrl.pathname.replace(/^\/+|\/+$/g, "");
  if (!DASHBOARD_SLUGS.has(slug)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const key = secretKey();
  if (!token || !key) {
    const login = new URL("/login/", request.url);
    login.searchParams.set("redirect", `/${slug}/`);
    return NextResponse.redirect(login);
  }

  try {
    const { payload } = await jwtVerify(token, key);
    if (String(payload.slug) !== slug) {
      const login = new URL("/login/", request.url);
      login.searchParams.set("error", "forbidden");
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  } catch {
    const login = new URL("/login/", request.url);
    login.searchParams.set("redirect", `/${slug}/`);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logos|brands|icons|team|.*\\..*).*)",
  ],
};
