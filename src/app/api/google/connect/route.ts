import { NextResponse } from "next/server";
import { googleAuthUrl, googleRedirectUri } from "@/lib/metrics/google-auth";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.AUTH_SECRET;
  const query = new URL(request.url).searchParams.get("secret") || "";
  return Boolean(secret) && query === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const state = process.env.CRON_SECRET || "mm";
    const url = googleAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Google connect failed",
        redirectUri: googleRedirectUri(),
      },
      { status: 500 }
    );
  }
}
