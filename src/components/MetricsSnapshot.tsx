import { getClientSnapshot, type MetricTotals } from "@/lib/metrics/snapshot";

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
  { key: "spend", label: "Spend", prefix: "£" },
  { key: "clicks", label: "Clicks", prefix: "" },
  { key: "impressions", label: "Impressions", prefix: "" },
  { key: "reach", label: "Reach", prefix: "" },
  { key: "engagement", label: "Engagement", prefix: "" },
  { key: "conversions", label: "Conversions", prefix: "" },
];

export default async function MetricsSnapshot({ slug }: { slug: string }) {
  let snapshot = null;
  try {
    snapshot = await getClientSnapshot(slug, 7);
  } catch {
    return null;
  }
  if (!snapshot) return null;

  const updated = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "waiting for first sync";

  return (
    <section className="px-6 pb-8 pt-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow mb-2 block">This week</span>
            <h2 className="font-serif text-3xl">Performance snapshot</h2>
            <p className="mt-2 text-sm text-[#cfcfcf]">
              Last 7 days vs the week before. Updated {updated}.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TILES.map(({ key, label, prefix }) => (
            <div key={key} className="card p-5">
              <div className="text-sm text-[#cfcfcf]">{label}</div>
              <div className="mt-2 text-2xl font-bold text-[#ff808b]">
                {prefix}
                {formatNumber(snapshot.totals[key])}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {change(snapshot.totals[key], snapshot.previous[key])} vs prior week
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
