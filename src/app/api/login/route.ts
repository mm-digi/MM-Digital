import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser } from "@/lib/users";
import { createSessionToken, dashboardNameForSlug, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username || "");
  const password = String(body?.password || "");
  const remember = Boolean(body?.remember);

  const user = findUser(username);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await createSessionToken(
    {
      username: user.username,
      slug: user.slug,
      name: dashboardNameForSlug(user.slug),
    },
    remember
  );

  const response = NextResponse.json({ ok: true, redirect: `/${user.slug}/` });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(remember));
  return response;
}
