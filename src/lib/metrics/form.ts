export type FormSlice = {
  clientId: string;
  date: string;
  source: string;
  sessions: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

export type FormStanding = {
  slug: string;
  name: string;
  change: number;
};

type Totals = {
  sessions: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

function emptyTotals(): Totals {
  return { sessions: 0, reach: 0, impressions: 0, clicks: 0, conversions: 0 };
}

function addSlice(target: Totals, row: FormSlice) {
  target.sessions += row.sessions;
  target.reach += row.reach;
  target.impressions += row.impressions;
  target.clicks += row.clicks;
  target.conversions += row.conversions;
}

function shiftDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(base.getUTCDate() + days);
  return next;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function channelChange(source: string, current: Totals, previous: Totals) {
  if (source === "ga4") {
    if (previous.sessions <= 0) return null;
    return (current.sessions - previous.sessions) / previous.sessions;
  }
  if (source === "instagram") {
    if (previous.reach <= 0) return null;
    return (current.reach - previous.reach) / previous.reach;
  }
  if (source === "facebook") {
    if (previous.impressions <= 0) return null;
    return (current.impressions - previous.impressions) / previous.impressions;
  }
  if (source === "facebook_ads") {
    if (previous.conversions > 0) return (current.conversions - previous.conversions) / previous.conversions;
    if (current.conversions <= 0 && previous.clicks > 0) return (current.clicks - previous.clicks) / previous.clicks;
    return null;
  }
  return null;
}

export function changeLabel(change: number) {
  const pct = Math.round(change * 100);
  if (pct > 0) return `Up ${pct}% on last month`;
  if (pct < 0) return `Down ${Math.abs(pct)}% on last month`;
  return "Level on last month";
}

export function dashboardClientId(slug: string, clients: { id: string; slug: string }[]) {
  const candidates = [slug, slug.replace(/-dashboard$/, ""), slug.replace(/-2$/, "")];
  for (const candidate of candidates) {
    const found = clients.find((client) => client.slug === candidate);
    if (found) return found.id;
  }
  return null;
}

export function scoreClientForm(
  dashboards: { slug: string; name: string }[],
  clients: { id: string; slug: string }[],
  rows: FormSlice[],
  today = new Date(),
): { best: FormStanding | null; worst: FormStanding | null } {
  const to = new Date(today);
  to.setUTCHours(0, 0, 0, 0);
  const monthFrom = iso(shiftDays(to, -29));
  const monthPrevFrom = iso(shiftDays(shiftDays(to, -29), -30));
  const scored: FormStanding[] = [];

  for (const dashboard of dashboards) {
    const clientId = dashboardClientId(dashboard.slug, clients);
    if (!clientId) continue;
    const bySource = new Map<string, { current: Totals; previous: Totals }>();
    for (const row of rows) {
      if (row.clientId !== clientId || row.date < monthPrevFrom || row.date > iso(to)) continue;
      const bucket = bySource.get(row.source) ?? { current: emptyTotals(), previous: emptyTotals() };
      if (row.date >= monthFrom) addSlice(bucket.current, row);
      else addSlice(bucket.previous, row);
      bySource.set(row.source, bucket);
    }
    const changes: number[] = [];
    for (const [source, bucket] of bySource) {
      const change = channelChange(source, bucket.current, bucket.previous);
      if (change !== null && Number.isFinite(change)) changes.push(change);
    }
    if (!changes.length) continue;
    const change = changes.reduce((sum, item) => sum + item, 0) / changes.length;
    scored.push({ slug: dashboard.slug, name: dashboard.name, change });
  }

  scored.sort((a, b) => b.change - a.change || a.name.localeCompare(b.name, "en-GB"));
  const best = scored[0] ?? null;
  const worst = scored.length > 1 ? scored[scored.length - 1] : null;
  if (!best || !worst || best.slug === worst.slug || changeLabel(best.change) === changeLabel(worst.change)) {
    return { best, worst: null };
  }
  return { best, worst };
}
