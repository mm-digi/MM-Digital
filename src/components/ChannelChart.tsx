import { formatShortDate } from "@/lib/metrics/dates";
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

type MetricKey = Exclude<keyof DayPoint, "date">;

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

function formatNumber(value: number, prefix = "", duration = false) {
  if (duration) return formatDuration(value);
  if (!value) return `${prefix}0`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (prefix === "£") return `£${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}

function yTicks(max: number) {
  const raw = max <= 0 ? 1 : max;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = Math.ceil(raw / magnitude) * magnitude;
  return [0, nice * 0.25, nice * 0.5, nice * 0.75, nice];
}

function aggregate(values: number[], mode: "sum" | "last" | "avg") {
  if (mode === "last") {
    for (let i = values.length - 1; i >= 0; i -= 1) {
      if (Number(values[i] || 0) > 0) return Number(values[i]);
    }
    return 0;
  }
  if (mode === "avg") {
    const nums = values.filter((value) => Number(value) > 0);
    if (!nums.length) return 0;
    return nums.reduce((sum, value) => sum + value, 0) / nums.length;
  }
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
}

function linePoints(
  values: number[],
  max: number,
  left: number,
  top: number,
  plotWidth: number,
  plotHeight: number
) {
  return values.map((value, index) => {
    const x = values.length === 1 ? left + plotWidth / 2 : left + (index / (values.length - 1)) * plotWidth;
    const y = top + plotHeight - (value / max) * plotHeight;
    return `${x},${y}`;
  });
}

export default function ChannelChart({
  title,
  description,
  metric,
  prefix = "",
  duration = false,
  series,
  seriesBySource,
  bySource,
}: {
  title: string;
  description: string;
  metric: MetricKey;
  prefix?: string;
  duration?: boolean;
  series: DayPoint[];
  seriesBySource: Record<string, DayPoint[]>;
  bySource: Record<string, MetricTotals>;
}) {
  const width = 640;
  const height = 220;
  const left = 58;
  const right = 12;
  const top = 12;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const mode = metric === "followers" ? "last" : metric === "avgDuration" ? "avg" : "sum";
  const total = aggregate(
    series.map((point) => Number(point[metric] || 0)),
    mode
  );
  const sourceKeys = Object.keys(seriesBySource).length ? Object.keys(seriesBySource) : Object.keys(bySource);
  const sources = sourceKeys
    .map((source) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      color: SOURCE_COLORS[source] || "#ff808b",
      value: aggregate(
        (seriesBySource[source] || []).map((point) => Number(point[metric] || 0)),
        mode
      ),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const allValues = [
    ...series.map((point) => point[metric]),
    ...sources.flatMap((item) => (seriesBySource[item.source] || []).map((point) => point[metric])),
  ];
  const ticks = yTicks(Math.max(...allValues, 1));
  const max = ticks[ticks.length - 1] || 1;
  const xIndexes = series.length <= 1 ? [0] : [0, Math.floor((series.length - 1) / 3), Math.floor(((series.length - 1) * 2) / 3), series.length - 1];
  const uniqueX = [...new Set(xIndexes)];

  const totalLine = linePoints(
    series.map((point) => point[metric]),
    max,
    left,
    top,
    plotWidth,
    plotHeight
  );

  return (
    <div className="mm-card p-5">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-serif text-xl">{title}</h3>
        <strong className="text-[#ff808b]">
          {formatNumber(total, prefix, duration)} {mode === "last" ? "now" : mode === "avg" ? "average" : "this month"}
        </strong>
      </div>
      <p className="mb-4 text-sm text-[#cfcfcf]">{description}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label={title}>
        {ticks.map((tick) => {
          const y = top + plotHeight - (tick / max) * plotHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={left + plotWidth} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x={left - 8} y={y + 4} textAnchor="end" fill="#cfcfcf" fontSize="11" fontFamily="Arial, sans-serif">
                {formatNumber(tick, prefix, duration)}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={left} y1={top} y2={top + plotHeight} stroke="rgba(255,255,255,0.25)" />
        <line x1={left} x2={left + plotWidth} y1={top + plotHeight} y2={top + plotHeight} stroke="rgba(255,255,255,0.25)" />
        {uniqueX.map((index) => {
          const x = series.length === 1 ? left + plotWidth / 2 : left + (index / (series.length - 1)) * plotWidth;
          return (
            <text key={`x-${index}`} x={x} y={height - 8} textAnchor="middle" fill="#cfcfcf" fontSize="11" fontFamily="Arial, sans-serif">
              {formatShortDate(series[index]?.date || "")}
            </text>
          );
        })}
        <polyline points={totalLine.join(" ")} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="4" />
        {sources.map((item) => {
          const values = (seriesBySource[item.source] || []).map((point) => point[metric]);
          if (!values.length) return null;
          return (
            <polyline
              key={item.source}
              points={linePoints(values, max, left, top, plotWidth, plotHeight).join(" ")}
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
