import { NextResponse } from "next/server";

// /api/mobile/* is called from the native app (no browser, no CORS) and,
// during development, from `expo start --web` (a browser on a different
// origin/port). Auth here is a bearer token in the body/header, never a
// cookie, so an open CORS policy doesn't weaken anything - there's no
// credential a third-party page could silently ride along with.
export const MOBILE_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...MOBILE_CORS_HEADERS, ...init?.headers },
  });
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: MOBILE_CORS_HEADERS });
}
