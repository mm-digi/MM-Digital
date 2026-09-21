import ChannelChart from "@/components/ChannelChart";
import { getClientSnapshot, type MetricTotals, type PeriodBlock } from "@/lib/metrics/snapshot";

function formatNumber(value: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

function change(current: number, previous: number) {
  if (!previous && !current) return "–";
  if (!previous) return "new";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

const TILES: { key: keyof MetricTotals; label: string; prefix: string }[] = [
  { key: "sessions", label: "Website sessions", prefix: "" },
  { key: "spend", label: "Ad spend", prefix: "£" },
  { key: "clicks", label: "Clicks", prefix: "" },
  { key: "impressions", label: "Impressions", prefix: "" },
  { key: "reach", label: "Reach", prefix: "" },
  { key: "engagement", label: "Engagement", prefix: "" },
  { key: "conversions", label: "Conversions", prefix: "" },
];

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

function PeriodGrid({ period, compare }: { period: PeriodBlock; compare: string }) {
  return (
    <div>
      <div className="mb-4">
        <span className="eyebrow mb-1 block">{period.label}</span>
        <p className="text-sm text-[#cfcfcf]">
          {period.from} to {period.to} · vs previous {compare}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {TILES.map(({ key, label, prefix }) => (
          <div key={`${period.label}-${key}`} className="card p-5">
            <div className="text-sm text-[#cfcfcf]">{label}</div>
            <div className="mt-2 text-2xl font-bold text-[#ff808b]">
              {prefix}
              {formatNumber(period.totals[key])}
            </div>
            <div className="mt-1 text-xs text-white/60">{change(period.totals[key], period.previous[key])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceTable({ title, data }: { title: string; data: Record<string, MetricTotals> }) {
  const rows = Object.entries(data);
  if (!rows.length) return null;
  return (
    <div className="card overflow-x-auto p-5">
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-[#cfcfcf]">
          <tr>
            <th className="pb-3 font-normal">Channel</th>
            <th className="pb-3 font-normal">Sessions</th>
            <th className="pb-3 font-normal">Spend</th>
            <th className="pb-3 font-normal">Clicks</th>
            <th className="pb-3 font-normal">Impressions</th>
            <th className="pb-3 font-normal">Reach</th>
            <th className="pb-3 font-normal">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([source, totals]) => (
            <tr key={source} className="border-t border-white/10">
              <td className="py-3">{SOURCE_LABELS[source] || source}</td>
              <td>{formatNumber(totals.sessions)}</td>
              <td>£{formatNumber(totals.spend)}</td>
              <td>{formatNumber(totals.clicks)}</td>
              <td>{formatNumber(totals.impressions)}</td>
              <td>{formatNumber(totals.reach)}</td>
              <td>{formatNumber(totals.engagement)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MetricsSnapshot({ slug }: { slug: string }) {
  let snapshot = null;
  try {
    snapshot = await getClientSnapshot(slug);
  } catch {
    return null;
  }
  if (!snapshot) return null;

  const updated = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "waiting for first sync";

  return (
    <section className="px-6 pb-8 pt-10">
      <div className="mx-auto max-w-[1600px] space-y-10">
        <div>
          <span className="eyebrow mb-2 block">Live reporting</span>
          <h2 className="font-serif text-3xl">Performance snapshot</h2>
          <p className="mt-2 text-sm text-[#cfcfcf]">Updated {updated}. Looker Studio remains below for the full desktop report.</p>
        </div>

        <PeriodGrid period={snapshot.week} compare="week" />
        <PeriodGrid period={snapshot.month} compare="month" />

        <div className="grid gap-4 lg:grid-cols-2">
          <ChannelChart
            title="Website sessions"
            description="How many visits the website received, from Google Analytics."
            metric="sessions"
            series={snapshot.series}
            seriesBySource={snapshot.seriesBySource}
            bySource={snapshot.bySourceMonth}
          />
          <ChannelChart
            title="Ad spend"
            description="Paid media spend, split by Facebook Ads and LinkedIn Ads."
            metric="spend"
            prefix="£"
            series={snapshot.series}
            seriesBySource={snapshot.seriesBySource}
            bySource={snapshot.bySourceMonth}
          />
          <ChannelChart
            title="Impressions"
            description="How often your content was shown, split by Facebook, Instagram, LinkedIn and ads."
            metric="impressions"
            series={snapshot.series}
            seriesBySource={snapshot.seriesBySource}
            bySource={snapshot.bySourceMonth}
          />
          <ChannelChart
            title="Clicks"
            description="Clicks on ads and social posts, split by channel."
            metric="clicks"
            series={snapshot.series}
            seriesBySource={snapshot.seriesBySource}
            bySource={snapshot.bySourceMonth}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SourceTable title="This week by channel" data={snapshot.bySourceWeek} />
          <SourceTable title="This month by channel" data={snapshot.bySourceMonth} />
        </div>
      </div>
    </section>
  );
}
