import { CLIENT_DASHBOARDS } from "@/lib/clients";
import { changeLabel, scoreClientForm, type FormSlice } from "@/lib/metrics/form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientForm } from "@/pixel/types";

const EMPTY: ClientForm = { best: null, worst: null };
let cached: { at: number; form: ClientForm } | null = null;
const CACHE_MS = 120_000;

function shiftDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(base.getUTCDate() + days);
  return next;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function metricRows(from: string, to: string): Promise<FormSlice[]> {
  const supabase = createAdminClient();
  const rows: FormSlice[] = [];
  for (let start = 0; start < 20000; start += 1000) {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("client_id, date, source, sessions, reach, impressions, clicks, conversions")
      .gte("date", from)
      .lte("date", to)
      .range(start, start + 999);
    if (error) throw new Error(error.message);
    for (const row of data || []) {
      rows.push({
        clientId: String(row.client_id),
        date: String(row.date).slice(0, 10),
        source: String(row.source),
        sessions: Number(row.sessions || 0),
        reach: Number(row.reach || 0),
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        conversions: Number(row.conversions || 0),
      });
    }
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function loadClientForm(today = new Date()): Promise<ClientForm> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.form;
  const supabase = createAdminClient();
  const to = new Date(today);
  to.setUTCHours(0, 0, 0, 0);
  const from = iso(shiftDays(shiftDays(to, -29), -30));
  const [{ data, error }, rows] = await Promise.all([
    supabase.from("clients").select("id, slug"),
    metricRows(from, iso(to)),
  ]);
  if (error) throw new Error(error.message);
  const clients = (data || []).map((client) => ({ id: String(client.id), slug: String(client.slug) }));
  const scored = scoreClientForm(CLIENT_DASHBOARDS, clients, rows, today);
  const form: ClientForm = {
    best: scored.best ? { slug: scored.best.slug, name: scored.best.name, label: changeLabel(scored.best.change) } : null,
    worst: scored.worst ? { slug: scored.worst.slug, name: scored.worst.name, label: changeLabel(scored.worst.change) } : null,
  };
  cached = { at: Date.now(), form };
  return form;
}

export function emptyClientForm() {
  return EMPTY;
}
