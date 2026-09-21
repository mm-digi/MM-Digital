import { NextResponse } from "next/server";
import { exchangeCode, googleRedirectUri } from "@/lib/metrics/google-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) {
    return new NextResponse(`Google returned: ${error}`, { status: 400 });
  }
  if (!code) {
    return new NextResponse(`Missing code. Redirect URI must be exactly:\n${googleRedirectUri()}`, {
      status: 400,
    });
  }

  try {
    const tokens = await exchangeCode(code);
    const refresh = tokens.refresh_token;
    if (!refresh) {
      return new NextResponse(
        "Google did not return a refresh token. Remove MM Digital from your Google account permissions and try again with prompt=consent.",
        { status: 400 }
      );
    }
    const html = `<!doctype html>
<html><body style="font-family:sans-serif;max-width:720px;margin:40px auto;line-height:1.5">
  <h1>Google Analytics connected</h1>
  <p>Add this to Vercel as <strong>GOOGLE_REFRESH_TOKEN</strong> (Production). Do not put it in GitHub.</p>
  <textarea style="width:100%;height:120px">${refresh}</textarea>
  <p>Then set each client’s <code>ga4_property_id</code> in Supabase.</p>
</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (err) {
    return new NextResponse(err instanceof Error ? err.message : "Callback failed", { status: 500 });
  }
}
