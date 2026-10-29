import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DASHBOARD_SLUGS, getDashboard } from "@/lib/clients";
import { buildInsights } from "@/lib/metrics/insights";
import { getClientSnapshot } from "@/lib/metrics/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };

// A client's figures and Ask MM answers for the quick-look window in the pixel office.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "staff") {
    return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
  }
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!DASHBOARD_SLUGS.has(slug)) return NextResponse.json({ error: "Unknown client." }, { status: 404, headers });
  const name = getDashboard(slug)?.name || slug;
  const snapshot = await getClientSnapshot(slug).catch(() => null);
  if (!snapshot) return NextResponse.json({ slug, name, updatedAt: null, insights: [] }, { headers });
  return NextResponse.json({ slug, name, updatedAt: snapshot.updatedAt, insights: buildInsights(snapshot) }, { headers });
}
