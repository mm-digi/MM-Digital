import type { DayPoint, MetricTotals } from "@/lib/metrics/snapshot";

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

const SOURCE_COLORS: Record<string, string> = {
  ga4: "#7dd3fc",
  facebook: "#4c8dff",
  facebook_ads: "#ff808b",
  instagram: "#e1306c",
  linkedin: "#70b5f9",
  linkedin_ads: "#f5c16c",
};

type MetricKey = "sessions" | "spend" | "impressions" | "clicks";

function formatNumber(value: number, prefix = "") {
  if (!value) return `${prefix}0`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (prefix === "£") return `£${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}

function linePoints(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 10) - 5;
    return `${x},${y}`;
  });
}

export default function ChannelChart({
  title,
  description,
  metric,
  prefix = "",
  series,
  seriesBySource,
  bySource,
}: {
  title: string;
  description: string;
  metric: MetricKey;
  prefix?: string;
  series: DayPoint[];
  seriesBySource: Record<string, DayPoint[]>;
  bySource: Record<string, MetricTotals>;
}) {
  const width = 560;
  const height = 150;
  const total = series.reduce((sum, point) => sum + point[metric], 0);
  const sources = Object.entries(bySource)
    .map(([source, totals]) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      color: SOURCE_COLORS[source] || "#ff808b",
      value: totals[metric],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalLine = linePoints(
    series.map((point) => point[metric]),
    width,
    height
  );

  return (
    <div className="card p-5">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-serif text-xl">{title}</h3>
        <strong className="text-[#ff808b]">{formatNumber(total, prefix)} this month</strong>
      </div>
      <p className="mb-4 text-sm text-[#cfcfcf]">{description}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label={title}>
        <polyline points={totalLine.join(" ")} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
        {sources.map((item) => {
          const values = (seriesBySource[item.source] || []).map((point) => point[metric]);
          if (!values.length) return null;
          return (
            <polyline
              key={item.source}
              points={linePoints(values, width, height).join(" ")}
              fill="none"
              stroke={item.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {sources.length ? (
          sources.map((item) => (
            <span key={item.source} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.label} {formatNumber(item.value, prefix)}
              <span className="text-white/45">({Math.round((item.value / (total || 1)) * 100)}%)</span>
            </span>
          ))
        ) : (
          <span className="text-white/50">No data for this metric yet.</span>
        )}
      </div>
    </div>
  );
}
