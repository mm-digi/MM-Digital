import { NextResponse } from "next/server";
import { ALERT_TO, checkDataHealth, sendHealthTest } from "@/lib/metrics/health";

// Manual check of client data health, for testing the alert email.
// ?test=1 sends a test email to the first alert address only. Otherwise it
// just reports what it found, without emailing anyone.
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.AUTH_SECRET;
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(request.url).searchParams.get("secret") || "";
  return Boolean(secret) && (bearer === secret || query === secret);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (new URL(request.url).searchParams.get("test") === "1") {
    const { sent, report } = await sendHealthTest(ALERT_TO[0]);
    return NextResponse.json({ sent, to: ALERT_TO[0], report });
  }
  return NextResponse.json(await checkDataHealth());
}
