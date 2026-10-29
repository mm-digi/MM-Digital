import { createAdminClient } from "@/lib/supabase/admin";
import { findClient, type MetricTotals } from "@/lib/metrics/snapshot";

// Calendar-month totals for the "Month by month" section of a dashboard.
// Comparisons are kept fair: the month in progress is compared with the same
// days of the month before, and a month that only has a few days of data
// (because syncing started part way through) is never used as a comparison.

export type MonthTotals = MetricTotals & { followers: number };

export type MonthBlock = {
  month: string;
  label: string;
  short: string;
  from: string;
  to: string;
  partial: "start" | "current" | null;
  totals: MonthTotals;
  previous: MonthTotals | null;
  bySource: Record<string, MonthTotals>;
  bySourcePrevious: Record<string, MonthTotals>;
};

type Row = {
  date: string;
  source: string;
  sessions: number | null;
  spend: number | null;
  clicks: number | null;
  impressions: number | null;
  reach: number | null;
  engagement: number | null;
  conversions: number | null;
  followers: number | null;
};

const PAGE = 1000;

function emptyTotals(): MonthTotals {
  return { sessions: 0, spend: 0, clicks: 0, impressions: 0, reach: 0, engagement: 0, conversions: 0, followers: 0 };
}

// Followers is a running count, so a period uses each channel's last reading, not a sum.
function totalsOf(rows: Row[]) {
  const totals = emptyTotals();
  const lastFollowers = new Map<string, [string, number]>();
  for (const row of rows) {
    totals.sessions += Number(row.sessions || 0);
    totals.spend += Number(row.spend || 0);
    totals.clicks += Number(row.clicks || 0);
    totals.impressions += Number(row.impressions || 0);
    totals.reach += Number(row.reach || 0);
    totals.engagement += Number(row.engagement || 0);
    totals.conversions += Number(row.conversions || 0);
    const followers = Number(row.followers || 0);
    const seen = lastFollowers.get(row.source);
    if (followers > 0 && (!seen || row.date >= seen[0])) lastFollowers.set(row.source, [row.date, followers]);
  }
  for (const [, followers] of lastFollowers.values()) totals.followers += followers;
  return totals;
}

function bySourceOf(rows: Row[]) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    if (!groups.has(row.source)) groups.set(row.source, []);
    groups.get(row.source)!.push(row);
  }
  return Object.fromEntries([...groups].map(([source, list]) => [source, totalsOf(list)]));
}

function monthAfter(month: string) {
  const [year, value] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, value, 1));
  return next.toISOString().slice(0, 7);
}

function monthNames(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return {
    label: date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    short: date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
  };
}

async function loadRows(clientId: string) {
  const supabase = createAdminClient();
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("date, source, sessions, spend, clicks, impressions, reach, engagement, conversions, followers")
      .eq("client_id", clientId)
      .order("date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return rows.map((row) => ({ ...row, date: String(row.date) }));
}

export async function getClientHistory(slug: string): Promise<MonthBlock[] | null> {
  const client = await findClient(slug);
  if (!client) return null;
  const rows = await loadRows(client.id);
  if (!rows.length) return null;

  const firstDate = rows[0].date;
  const lastDate = rows[rows.length - 1].date;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const months: string[] = [];
  for (let month = firstDate.slice(0, 7); month <= lastDate.slice(0, 7); month = monthAfter(month)) months.push(month);

  const rowsIn = (month: string, uptoDay?: number) =>
    rows.filter((row) => row.date.startsWith(month) && (uptoDay === undefined || Number(row.date.slice(8, 10)) <= uptoDay));

  const blocks: MonthBlock[] = [];
  months.forEach((month, index) => {
    const own = rowsIn(month);
    const startsLate = index === 0 && firstDate.slice(8, 10) !== "01";
    const from = own[0]?.date || `${month}-01`;
    const to = own[own.length - 1]?.date || from;
    const partial = startsLate ? "start" : month === currentMonth ? "current" : null;

    let previous: MonthTotals | null = null;
    let bySourcePrevious: Record<string, MonthTotals> = {};
    const before = blocks[index - 1];
    if (before && before.partial !== "start") {
      // The month in progress is compared with the same days of the month before.
      const compare = partial === "current" ? rowsIn(before.month, Number(to.slice(8, 10))) : rowsIn(before.month);
      if (compare.length) {
        previous = totalsOf(compare);
        bySourcePrevious = bySourceOf(compare);
      }
    }

    blocks.push({
      month,
      ...monthNames(month),
      from,
      to,
      partial,
      totals: totalsOf(own),
      previous,
      bySource: bySourceOf(own),
      bySourcePrevious,
    });
  });
  return blocks;
}
