import { NextResponse } from "next/server";
import { buildBriefing, sendBriefing } from "@/lib/briefing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The 9am team briefing. Vercel cron calls this daily. ?test=1 sends a test
// copy to Tash only, ?sample=1 sends Tash the real unmarked email, and
// ?preview=1 shows it without sending.
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
  try {
    // ?preview=1 shows today's email in the browser without sending it.
    if (params.get("preview") === "1") {
      const email = await buildBriefing(new Date(), true);
      return new NextResponse(email.html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return NextResponse.json(await sendBriefing({ test, sample }));
  } catch (error) {
    return NextResponse.json({ sent: false, error: error instanceof Error ? error.message : "Briefing failed" }, { status: 500 });
  }
}
