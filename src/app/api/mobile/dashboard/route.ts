import { readSessionToken } from "@/lib/auth";
import { getClientSnapshot } from "@/lib/metrics/snapshot";
import { corsJson, corsPreflight } from "@/lib/mobile-cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const session = token ? await readSessionToken(token) : null;
  if (!session) {
    return corsJson({ error: "Not signed in." }, { status: 401 });
  }

  const snapshot = await getClientSnapshot(session.slug).catch(() => null);
  if (!snapshot) {
    return corsJson({ error: "No data yet for this dashboard." }, { status: 404 });
  }

  return corsJson({ session, snapshot });
}
