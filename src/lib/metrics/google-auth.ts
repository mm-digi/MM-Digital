const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

function siteOrigin() {
  return (
    process.env.GOOGLE_OAUTH_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://mm-digital-git-main-mm-digital.vercel.app"
  ).replace(/\/$/, "");
}

export function googleRedirectUri() {
  return `${siteOrigin()}/api/google/callback/`;
}

export function googleAuthUrl(state: string) {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not set");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_description || json.error || "Google token exchange failed");
  }
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

export async function googleAccessToken() {
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!refresh || !id || !secret) {
    throw new Error("Google OAuth env vars are missing");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refresh,
      client_id: id,
      client_secret: secret,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_description || json.error || "Google refresh failed");
  }
  return String(json.access_token);
}
