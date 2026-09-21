import { createAdminClient } from "@/lib/supabase/admin";
import { matchClient, type ClientRow } from "@/lib/metrics/match-client";
import { fetchGa4Property } from "@/lib/metrics/ga4";
import { fetchWindsor, rowToMetrics, WINDSOR_CONNECTORS } from "@/lib/metrics/windsor";

type Extra = {
  views?: number | null;
  likes?: number | null;
  page_views?: number | null;
  reactions?: number | null;
  pageviews?: number | null;
  new_users?: number | null;
  avg_duration?: number | null;
  campaigns?: { name: string; spend: number; clicks: number; conversions: number }[];
};

function mergeExtra(a: Extra = {}, b: Extra = {}): Extra {
  const campaigns = [...(a.campaigns || [])];
  for (const campaign of b.campaigns || []) {
    const found = campaigns.find((item) => item.name === campaign.name);
    if (found) {
      found.spend += campaign.spend;
      found.clicks += campaign.clicks;
      found.conversions += campaign.conversions;
    } else campaigns.push({ ...campaign });
  }
  return {
    views: (a.views || 0) + (b.views || 0) || null,
    likes: (a.likes || 0) + (b.likes || 0) || null,
    page_views: (a.page_views || 0) + (b.page_views || 0) || null,
    reactions: (a.reactions || 0) + (b.reactions || 0) || null,
    pageviews: (a.pageviews || 0) + (b.pageviews || 0) || null,
    new_users: (a.new_users || 0) + (b.new_users || 0) || null,
    avg_duration: b.avg_duration ?? a.avg_duration ?? null,
    campaigns,
  };
}

export type SyncResult = {
  ok: boolean;
  upserted: number;
  unmatched: string[];
  errors: string[];
  sources: Record<string, number>;
};

export async function syncDailyMetrics(): Promise<SyncResult> {
  const supabase = createAdminClient();
  const { data: clients, error: clientError } = await supabase
    .from("clients")
    .select("id, name, slug, windsor_account_name, ga4_property_id");

  if (clientError) {
    throw new Error(clientError.message);
  }

  const result: SyncResult = {
    ok: true,
    upserted: 0,
    unmatched: [],
    errors: [],
    sources: {},
  };

  const unmatched = new Set<string>();

  for (const connector of WINDSOR_CONNECTORS) {
    try {
      const rows = await fetchWindsor(connector.connector, connector.fields);
      result.sources[connector.source] = rows.length;
      const byKey = new Map<string, ReturnType<typeof rowToMetrics>>();

      for (const row of rows) {
        const metrics = rowToMetrics(connector.source, row);
        if (!metrics.date || (!metrics.accountName && !metrics.accountId)) continue;
        const key = `${metrics.date}|${metrics.accountId}|${metrics.accountName}`;
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, metrics);
          continue;
        }
        byKey.set(key, {
          ...existing,
          impressions: (existing.impressions || 0) + (metrics.impressions || 0),
          reach: (existing.reach || 0) + (metrics.reach || 0),
          clicks: (existing.clicks || 0) + (metrics.clicks || 0),
          spend: (existing.spend || 0) + (metrics.spend || 0),
          engagement: (existing.engagement || 0) + (metrics.engagement || 0),
          conversions: (existing.conversions || 0) + (metrics.conversions || 0),
          followers: metrics.followers ?? existing.followers,
          extra: mergeExtra(existing.extra as Extra, metrics.extra as Extra) as typeof existing.extra,
        });
      }

      type MetricRow = {
        client_id: string;
        date: string;
        source: string;
        sessions: number | null;
        users: number | null;
        conversions: number | null;
        impressions: number | null;
        reach: number | null;
        clicks: number | null;
        spend: number | null;
        engagement: number | null;
        followers: number | null;
        extra: Extra;
        updated_at: string;
      };
      const merged = new Map<string, MetricRow>();
      for (const metrics of byKey.values()) {
        const client = matchClient(metrics.accountName, (clients || []) as ClientRow[]);
        if (!client) {
          unmatched.add(`${connector.source}: ${metrics.accountName || metrics.accountId}`);
          continue;
        }
        const mergeKey = `${client.id}|${metrics.date}|${connector.source}`;
        const existing = merged.get(mergeKey);
        if (!existing) {
          merged.set(mergeKey, {
            client_id: client.id,
            date: metrics.date,
            source: connector.source,
            sessions: metrics.sessions,
            users: metrics.users,
            conversions: metrics.conversions,
            impressions: metrics.impressions,
            reach: metrics.reach,
            clicks: metrics.clicks,
            spend: metrics.spend,
            engagement: metrics.engagement,
            followers: metrics.followers,
            extra: metrics.extra as Extra,
            updated_at: new Date().toISOString(),
          });
          continue;
        }
        existing.conversions = (Number(existing.conversions) || 0) + (metrics.conversions || 0);
        existing.impressions = (Number(existing.impressions) || 0) + (metrics.impressions || 0);
        existing.reach = (Number(existing.reach) || 0) + (metrics.reach || 0);
        existing.clicks = (Number(existing.clicks) || 0) + (metrics.clicks || 0);
        existing.spend = (Number(existing.spend) || 0) + (metrics.spend || 0);
        existing.engagement = (Number(existing.engagement) || 0) + (metrics.engagement || 0);
        existing.followers = metrics.followers ?? existing.followers;
        existing.extra = mergeExtra(existing.extra, metrics.extra);
      }
      const payload = [...merged.values()];

      if (!payload.length) continue;

      const { error } = await supabase.from("daily_metrics").upsert(payload, {
        onConflict: "client_id,date,source",
      });
      if (error) {
        result.errors.push(`${connector.source}: ${error.message}`);
        result.ok = false;
      } else {
        result.upserted += payload.length;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed";
      if (/no .* accounts are configured/i.test(message)) {
        result.errors.push(`${connector.source}: skipped (not connected in Windsor)`);
        continue;
      }
      result.ok = false;
      result.errors.push(`${connector.source}: ${message}`);
    }
  }

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    const gaClients = (clients || []).filter((client: { ga4_property_id?: string | null }) => client.ga4_property_id);
    result.sources.ga4 = 0;
    for (const client of gaClients) {
      try {
        const days = await fetchGa4Property(String(client.ga4_property_id), 90);
        result.sources.ga4 += days.length;
        const payload = days.map((day) => ({
          client_id: client.id,
          date: day.date,
          source: "ga4",
          sessions: day.sessions,
          users: day.users,
          conversions: day.conversions,
          extra: {
            pageviews: day.pageviews,
            new_users: day.newUsers,
            avg_duration: day.avgDuration,
          },
          updated_at: new Date().toISOString(),
        }));
        if (!payload.length) continue;
        const { error } = await supabase.from("daily_metrics").upsert(payload, {
          onConflict: "client_id,date,source",
        });
        if (error) {
          result.errors.push(`ga4 ${client.name}: ${error.message}`);
          result.ok = false;
        } else {
          result.upserted += payload.length;
        }
      } catch (error) {
        result.ok = false;
        result.errors.push(`ga4 ${client.name}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
  } else {
    result.errors.push("GA4 skipped: GOOGLE_REFRESH_TOKEN is not set");
  }

  result.unmatched = [...unmatched].slice(0, 50);
  return result;
}
