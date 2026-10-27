import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleAction } from "@/pixel/lib/actions";
import { getCurrentStaff } from "@/pixel/lib/auth";
import { withPixel } from "@/pixel/lib/db";
import { buildSnapshot } from "@/pixel/lib/snapshot";
import type { ActionBody } from "@/pixel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };

async function allowed() {
  const session = await getSession();
  return Boolean(session && session.role === "staff");
}

export async function GET() {
  if (!(await allowed())) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
  return withPixel(async () => {
    const staff = await getCurrentStaff();
    if (!staff) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
    const snapshot = await buildSnapshot(staff);
    return NextResponse.json(snapshot, { headers });
  });
}

export async function POST(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
  const body = (await request.json().catch(() => null)) as ActionBody | null;
  try {
    return await withPixel(async () => {
      const staff = await getCurrentStaff();
      if (!staff) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
      const result = await handleAction(staff, body);
      return NextResponse.json(result, { status: result.ok ? 200 : result.status || 400, headers });
    }, { persist: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "The office was busy. Try again.") {
      return NextResponse.json({ ok: false, error: message }, { status: 503, headers });
    }
    throw error;
  }
}
