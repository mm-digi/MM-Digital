import { NextResponse } from "next/server";
import { buildBriefing, sendBriefing } from "@/lib/briefing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The 9am team briefing. Vercel cron calls this on Mondays, Wednesdays and Fridays.
// ?test=1 sends a test copy to Tash only, ?sample=1 sends Tash the real unmarked
// email, and ?preview=1 shows it without sending. ?for=YYYY-MM-DD names the email
// for another day (Friday Briefing and so on), using today's figures.
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
  const params = new URL(request.url).searchParams;
  const test = params.get("test") === "1";
  const sample = params.get("sample") === "1";
  const forDay = params.get("for");
  const sendDate = forDay && /^\d{4}-\d{2}-\d{2}$/.test(forDay) ? new Date(`${forDay}T09:00:00Z`) : new Date();
  // Only tests and previews can be dated for another day; the real send is always for today.
  if (forDay && !test && !sample && params.get("preview") !== "1") {
    return NextResponse.json({ error: "?for only works with ?test, ?sample or ?preview" }, { status: 400 });
  }
  try {
    // ?preview=1 shows today's email in the browser without sending it.
    if (params.get("preview") === "1") {
      const email = await buildBriefing(new Date(), true, sendDate);
      return new NextResponse(email.html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return NextResponse.json(await sendBriefing({ test, sample, sendDate }));
  } catch (error) {
    return NextResponse.json({ sent: false, error: error instanceof Error ? error.message : "Briefing failed" }, { status: 500 });
  }
}
