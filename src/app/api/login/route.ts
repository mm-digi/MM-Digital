import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser } from "@/lib/users";
import { createSessionToken, dashboardNameForSlug, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  // The login form posts natively to this route (action="/api/login/") so it
  // still works if it's submitted before client JS has hydrated and attached
  // the fetch-based handler. That native submission arrives as form-encoded
  // data and expects an HTTP redirect back; the JS-enhanced path sends JSON
  // and expects a JSON response so it can show inline errors without a reload.
  const isFormPost = (request.headers.get("content-type") || "").includes("form");

  function fail(message: string) {
    if (isFormPost) {
      const url = new URL("/login/", request.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, { status: 303 });
    }
    return NextResponse.json({ error: message }, { status: 401 });
  }

  try {
    let username: string;
    let password: string;
    let remember: boolean;
    let redirectTo: string | null;

    if (isFormPost) {
      const form = await request.formData();
      username = String(form.get("username") || "");
      password = String(form.get("password") || "");
      remember = form.get("remember") === "on";
      redirectTo = String(form.get("redirect") || "") || null;
    } else {
      const body = await request.json().catch(() => null);
      username = String(body?.username || "");
      password = String(body?.password || "");
      remember = Boolean(body?.remember);
      redirectTo = null;
    }

    const user = findUser(username);
    if (!user) return fail("Invalid username or password.");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return fail("Invalid username or password.");

    const token = await createSessionToken(
      {
        username: user.username,
        slug: user.slug,
        name: dashboardNameForSlug(user.slug),
      },
      remember
    );

    const target = `/${user.slug}/`;
    const response = isFormPost
      ? NextResponse.redirect(new URL(redirectTo || target, request.url), { status: 303 })
      : NextResponse.json({ ok: true, redirect: target });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(remember));
    return response;
  } catch {
    return fail("Could not sign in. Please try again.");
  }
}
