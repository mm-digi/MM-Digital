import { createAdminClient } from "@/lib/supabase/admin";

export type MetricTotals = {
  sessions: number;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  engagement: number;
  conversions: number;
};

export type ClientSnapshot = {
  clientName: string;
  from: string;
  to: string;
  updatedAt: string | null;
  totals: MetricTotals;
  previous: MetricTotals;
  bySource: Record<string, MetricTotals>;
};

function emptyTotals(): MetricTotals {
  return {
    sessions: 0,
    spend: 0,
    clicks: 0,
    impressions: 0,
    reach: 0,
    engagement: 0,
    conversions: 0,
  };
}

function addRow(target: MetricTotals, row: Record<string, number | string | null>) {
  target.sessions += Number(row.sessions || 0);
  target.spend += Number(row.spend || 0);
  target.clicks += Number(row.clicks || 0);
  target.impressions += Number(row.impressions || 0);
  target.reach += Number(row.reach || 0);
  target.engagement += Number(row.engagement || 0);
  target.conversions += Number(row.conversions || 0);
}

export async function getClientSnapshot(slug: string, days = 7): Promise<ClientSnapshot | null> {
  const supabase = createAdminClient();
  const candidates = [slug, slug.replace(/-dashboard$/, ""), slug.replace(/-2$/, "")];
  let client = null;
  for (const candidate of [...new Set(candidates)]) {
    const { data } = await supabase.from("clients").select("id, name, slug").eq("slug", candidate).maybeSingle();
    if (data) {
      client = data;
      break;
    }
  }
  if (!client) {
    const { data } = await supabase.from("clients").select("id, name, slug").ilike("slug", `%${slug.replace(/-dashboard$/, "")}%`).maybeSingle();
    client = data;
  }
  if (!client) return null;

  const to = new Date();
  const from = new Date();
  from.setUTCDate(to.getUTCDate() - (days - 1));
  const prevTo = new Date(from);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1));

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("daily_metrics")
    .select("date, source, sessions, spend, clicks, impressions, reach, engagement, conversions, updated_at")
    .eq("client_id", client.id)
    .gte("date", iso(prevFrom))
    .lte("date", iso(to));

  const totals = emptyTotals();
  const previous = emptyTotals();
  const bySource: Record<string, MetricTotals> = {};
  let updatedAt: string | null = null;
  const fromIso = iso(from);

  for (const row of rows || []) {
    if (row.updated_at && (!updatedAt || row.updated_at > updatedAt)) updatedAt = row.updated_at;
    const bucket = row.date >= fromIso ? totals : previous;
    addRow(bucket, row);
    if (row.date >= fromIso) {
      bySource[row.source] ||= emptyTotals();
      addRow(bySource[row.source], row);
    }
  }

  const hasData = (rows || []).some((row) => row.date >= fromIso);
  if (!hasData) return null;

  return {
    clientName: client.name,
    from: fromIso,
    to: iso(to),
    updatedAt,
    totals,
    previous,
    bySource,
  };
}
