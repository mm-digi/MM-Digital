import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { findUser } from "@/lib/users";
import { createSessionToken, dashboardNameForSlug, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

function isSupabasePreview() {
  return process.env.VERCEL_ENV === "preview";
}

async function supabasePreviewLogin(username: string, password: string, remember: boolean) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const email = username.includes("@")
    ? username.trim()
    : `${username.trim().toLowerCase()}@clients.mm-digi.co.uk`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  const { data: accessRows, error: accessError } = await supabase
    .from("client_dashboard_access")
    .select("client_id")
    .eq("user_id", data.user.id);
  if (accessError || !accessRows?.length) return null;

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("slug, name")
    .in("id", accessRows.map((row) => row.client_id));
  if (clientsError || !clients?.length) return null;

  return {
    username: email.split("@")[0],
    slug: clients[0].slug,
    name: clients[0].name,
    remember,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const username = String(body?.username || "");
    const password = String(body?.password || "");
    const remember = Boolean(body?.remember);

    if (isSupabasePreview()) {
      const session = await supabasePreviewLogin(username, password, remember);
      if (!session) {
        return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
      }
      const token = await createSessionToken(session, remember);
      const response = NextResponse.json({ ok: true, redirect: `/${session.slug}/` });
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(remember));
      return response;
    }

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
  } catch {
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
