import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDashboard } from "./clients";

export const SESSION_COOKIE = "mm_session";

export type Session = {
  username: string;
  slug: string;
  name: string;
};

export const AUTH_SECRET_VALUE =
  process.env.AUTH_SECRET || "mm-digital-client-portal-secret-set-AUTH_SECRET-on-vercel";

function secretKey() {
  return new TextEncoder().encode(AUTH_SECRET_VALUE);
}

export async function createSessionToken(session: Session, remember: boolean) {
  const hours = remember ? 24 * 30 : 12;
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const username = String(payload.username || "");
    const slug = String(payload.slug || "");
    const name = String(payload.name || "");
    if (!username || !slug) return null;
    return { username, slug, name };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export function sessionCookieOptions(remember: boolean) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function dashboardNameForSlug(slug: string) {
  return getDashboard(slug)?.name || slug;
}
