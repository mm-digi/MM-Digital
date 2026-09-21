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

export type DayPoint = {
  date: string;
  sessions: number;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  engagement: number;
  followers: number;
  pageviews: number;
  newUsers: number;
  avgDuration: number;
  views: number;
  likes: number;
  reactions: number;
  pageViews: number;
};

export type CampaignPoint = {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
};

export type PeriodBlock = {
  label: string;
  from: string;
  to: string;
  totals: MetricTotals;
  previous: MetricTotals;
};

export type ClientSnapshot = {
  clientName: string;
  updatedAt: string | null;
  week: PeriodBlock;
  month: PeriodBlock;
  bySourceWeek: Record<string, MetricTotals>;
  bySourceMonth: Record<string, MetricTotals>;
  series: DayPoint[];
  seriesBySource: Record<string, DayPoint[]>;
  campaigns: CampaignPoint[];
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

function shiftDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(base.getUTCDate() + days);
  return next;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function extraOf(row: Record<string, unknown>) {
  const extra = row.extra;
  if (extra && typeof extra === "object") return extra as Record<string, unknown>;
  return {};
}

function extraNum(row: Record<string, unknown>, key: string) {
  return Number(extraOf(row)[key] || 0);
}

function emptyPoint(date: string): DayPoint {
  return {
    date,
    sessions: 0,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    conversions: 0,
    engagement: 0,
    followers: 0,
    pageviews: 0,
    newUsers: 0,
    avgDuration: 0,
    views: 0,
    likes: 0,
    reactions: 0,
    pageViews: 0,
  };
}

function fillSeries(fromIso: string, toIso: string, rows: Record<string, unknown>[]) {
  const byDate = new Map<string, DayPoint>();
  const cursor = new Date(`${fromIso}T00:00:00Z`);
  const end = new Date(`${toIso}T00:00:00Z`);
  while (cursor <= end) {
    const key = iso(cursor);
    byDate.set(key, emptyPoint(key));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  for (const row of rows) {
    const key = String(row.date);
    const point = byDate.get(key);
    if (!point) continue;
    const source = String(row.source || "");
    point.sessions += Number(row.sessions || 0);
    point.spend += Number(row.spend || 0);
    point.impressions += Number(row.impressions || 0);
    point.reach += Number(row.reach || 0);
    point.clicks += Number(row.clicks || 0);
    point.conversions += Number(row.conversions || 0);
    point.engagement += Number(row.engagement || 0);
    point.followers += Number(row.followers || 0);
    point.pageviews += extraNum(row, "pageviews") || (source === "ga4" ? Number(row.sessions || 0) : 0);
    point.newUsers += extraNum(row, "new_users") || Number(row.users || 0);
    point.avgDuration += extraNum(row, "avg_duration");
    point.views += extraNum(row, "views") || (source === "instagram" ? Number(row.impressions || 0) : 0);
    point.likes += extraNum(row, "likes") || (source === "instagram" || source === "linkedin" ? Number(row.engagement || 0) : 0);
    point.reactions += extraNum(row, "reactions") || (source === "facebook" ? Number(row.engagement || 0) : 0);
    point.pageViews += extraNum(row, "page_views") || (source === "facebook" || source === "linkedin" ? Number(row.impressions || 0) : 0);
  }
  return [...byDate.values()];
}

export async function getClientSnapshot(slug: string): Promise<ClientSnapshot | null> {
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
    const { data } = await supabase
      .from("clients")
      .select("id, name, slug")
      .ilike("slug", `%${slug.replace(/-dashboard$/, "")}%`)
      .maybeSingle();
    client = data;
  }
  if (!client) return null;

  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const weekFrom = shiftDays(to, -6);
  const weekPrevTo = shiftDays(weekFrom, -1);
  const weekPrevFrom = shiftDays(weekPrevTo, -6);
  const monthFrom = shiftDays(to, -29);
  const monthPrevTo = shiftDays(monthFrom, -1);
  const monthPrevFrom = shiftDays(monthPrevTo, -29);

  const { data: rows } = await supabase
    .from("daily_metrics")
    .select("date, source, sessions, spend, clicks, impressions, reach, engagement, conversions, followers, extra, updated_at")
    .eq("client_id", client.id)
    .gte("date", iso(monthPrevFrom))
    .lte("date", iso(to));

  const week = emptyTotals();
  const weekPrev = emptyTotals();
  const month = emptyTotals();
  const monthPrev = emptyTotals();
  const bySourceWeek: Record<string, MetricTotals> = {};
  const bySourceMonth: Record<string, MetricTotals> = {};
  let updatedAt: string | null = null;

  const weekFromIso = iso(weekFrom);
  const monthFromIso = iso(monthFrom);
  const weekPrevFromIso = iso(weekPrevFrom);
  const monthPrevFromIso = iso(monthPrevFrom);

  for (const row of rows || []) {
    if (row.updated_at && (!updatedAt || row.updated_at > updatedAt)) updatedAt = row.updated_at;
    const date = String(row.date);
    if (date >= weekFromIso) {
      addRow(week, row);
      bySourceWeek[row.source] ||= emptyTotals();
      addRow(bySourceWeek[row.source], row);
    } else if (date >= weekPrevFromIso) {
      addRow(weekPrev, row);
    }
    if (date >= monthFromIso) {
      addRow(month, row);
      bySourceMonth[row.source] ||= emptyTotals();
      addRow(bySourceMonth[row.source], row);
    } else if (date >= monthPrevFromIso) {
      addRow(monthPrev, row);
    }
  }

  const monthRows = (rows || []).filter((row) => String(row.date) >= monthFromIso);
  if (!monthRows.length) return null;

  const seriesBySource: Record<string, DayPoint[]> = {};
  const sources = [...new Set(monthRows.map((row) => String(row.source)))];
  for (const source of sources) {
    seriesBySource[source] = fillSeries(
      monthFromIso,
      iso(to),
      monthRows.filter((row) => String(row.source) === source)
    );
  }
  const campaignMap = new Map<string, CampaignPoint>();
  for (const row of monthRows) {
    const extra = extraOf(row as Record<string, unknown>);
    const campaigns = Array.isArray(extra.campaigns) ? extra.campaigns : [];
    for (const campaign of campaigns as CampaignPoint[]) {
      const found = campaignMap.get(campaign.name) || { name: campaign.name, spend: 0, clicks: 0, conversions: 0 };
      found.spend += Number(campaign.spend || 0);
      found.clicks += Number(campaign.clicks || 0);
      found.conversions += Number(campaign.conversions || 0);
      campaignMap.set(campaign.name, found);
    }
  }

  return {
    clientName: client.name,
    updatedAt,
    week: { label: "This week", from: weekFromIso, to: iso(to), totals: week, previous: weekPrev },
    month: { label: "This month", from: monthFromIso, to: iso(to), totals: month, previous: monthPrev },
    bySourceWeek,
    bySourceMonth,
    series: fillSeries(monthFromIso, iso(to), monthRows),
    seriesBySource,
    campaigns: [...campaignMap.values()].sort((a, b) => b.conversions - a.conversions || b.spend - a.spend),
  };
}
