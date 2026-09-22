import bcrypt from "bcryptjs";
import { findUser } from "@/lib/users";
import { createSessionToken, dashboardNameForSlug } from "@/lib/auth";
import { corsJson, corsPreflight } from "@/lib/mobile-cors";

export async function OPTIONS() {
  return corsPreflight();
}

// Mobile clients can't use the httpOnly session cookie the web login sets,
// so this returns the signed session token directly in the JSON body. The
// app stores it (SecureStore) and sends it back as `Authorization: Bearer
// <token>` on every request to /api/mobile/*.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const username = String(body?.username || "");
    const password = String(body?.password || "");

    const user = findUser(username);
    if (!user) {
      return corsJson({ error: "Invalid username or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return corsJson({ error: "Invalid username or password." }, { status: 401 });
    }

    // Mobile sessions stay signed in for 30 days by default - there's no
    // "keep me signed in" checkbox in the app, re-logging in on a phone
    // every 12 hours is just friction with no real security benefit here.
    const token = await createSessionToken(
      {
        username: user.username,
        slug: user.slug,
        name: dashboardNameForSlug(user.slug),
      },
      true
    );

    return corsJson({
      token,
      slug: user.slug,
      name: dashboardNameForSlug(user.slug),
    });
  } catch {
    return corsJson({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
