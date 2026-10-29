import { NextResponse } from "next/server";
import { alertOnDataHealth } from "@/lib/metrics/health";
import { syncDailyMetrics } from "@/lib/metrics/sync";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.AUTH_SECRET;
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(request.url).searchParams.get("secret") || "";
  return Boolean(secret) && (bearer === secret || query === secret);
}

// After syncing, check every client's figures and email the team if anything broke.
async function checkAfterSync(errors: string[]) {
  try {
    const { sent, report } = await alertOnDataHealth(errors);
    return { emailed: sent, problems: report.problems.length };
  } catch (error) {
    return { emailed: false, error: error instanceof Error ? error.message : "Health check failed" };
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncDailyMetrics();
    const health = await checkAfterSync(result.errors);
    return NextResponse.json({ ...result, health }, { status: result.ok ? 200 : 207 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const health = await checkAfterSync([`The whole sync failed: ${message}`]);
    return NextResponse.json({ ok: false, error: message, health }, { status: 500 });
  }
}

export const POST = GET;
