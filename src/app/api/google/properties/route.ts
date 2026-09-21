import { NextResponse } from "next/server";
import { listGa4Properties } from "@/lib/metrics/ga4";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.AUTH_SECRET;
  const query = new URL(request.url).searchParams.get("secret") || "";
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  return Boolean(secret) && (query === secret || bearer === secret);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const properties = await listGa4Properties();
    return NextResponse.json({ properties });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
