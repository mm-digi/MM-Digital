// The app talks to the same Next.js backend the website uses, via the
// token-based /api/mobile/* routes (the website itself uses httpOnly
// cookies, which don't work for a native client).
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://mm-digi.co.uk";

export type LoginResult =
  | { ok: true; token: string; slug: string; name: string }
  | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_URL}/api/mobile/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Invalid username or password." };
    }
    return { ok: true, token: data.token, slug: data.slug, name: data.name };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection." };
  }
}

export type MetricTotals = {
  sessions: number;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  engagement: number;
  conversions: number;
};

export type PeriodBlock = {
  label: string;
  from: string;
  to: string;
  totals: MetricTotals;
  previous: MetricTotals;
};

export type CampaignPoint = {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
};

export type ClientSnapshot = {
  clientName: string;
  updatedAt: string | null;
  week: PeriodBlock;
  month: PeriodBlock;
  bySourceWeek: Record<string, MetricTotals>;
  bySourceMonth: Record<string, MetricTotals>;
  campaigns: CampaignPoint[];
};

export type DashboardResult =
  | { ok: true; snapshot: ClientSnapshot; name: string }
  | { ok: false; error: string; unauthorized?: boolean };

export async function fetchDashboard(token: string): Promise<DashboardResult> {
  try {
    const res = await fetch(`${API_URL}/api/mobile/dashboard/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Could not load your dashboard.", unauthorized: res.status === 401 };
    }
    return { ok: true, snapshot: data.snapshot, name: data.session?.name || data.snapshot?.clientName };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection." };
  }
}
