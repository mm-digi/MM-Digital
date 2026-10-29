"use client";

import { useEffect, useRef, useState } from "react";
import type { MonthBlock, MonthTotals } from "@/lib/metrics/history";

// Colours are set inline because the WordPress stylesheets on some dashboard
// pages override Tailwind colour classes.
const PINK = "#ff808b";
const INK = "#ffffff";
const SOFT = "#cfcfcf";
const MUTED = "rgba(255,255,255,0.55)";

type MetricKey = keyof MonthTotals;

// Shared by the chart and the row of month figures under it, so they line up.
const CHART = { left: 52, right: 8 };

const METRICS: { key: MetricKey; label: string; money?: boolean; note?: string }[] = [
  { key: "sessions", label: "Website visits" },
  { key: "impressions", label: "Impressions" },
  { key: "reach", label: "Reach" },
  { key: "engagement", label: "Engagement" },
  { key: "followers", label: "Followers", note: "Followers at the end of each month." },
  { key: "clicks", label: "Clicks" },
  { key: "conversions", label: "Conversions" },
  { key: "spend", label: "Ad spend", money: true },
];

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

// Channels always appear in this order, whatever order the data arrives in.
function sourceOrder(source: string) {
  const index = Object.keys(SOURCE_LABELS).indexOf(source);
  return index === -1 ? Infinity : index;
}

function formatNumber(value: number, money = false) {
  const prefix = money ? "£" : "";
  if (!value) return `${prefix}0`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${prefix}${value.toLocaleString("en-GB", { maximumFractionDigits: money ? 0 : 1 })}`;
}

function change(current: number, previous: number | undefined) {
  if (previous === undefined || (!previous && !current)) return null;
  if (!previous) return { text: "new", up: true };
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 1) return { text: "no change", up: null };
  if (pct >= 200) return { text: `${Math.floor(current / previous)}x`, up: true };
  return { text: `${Math.abs(pct).toFixed(0)}%`, up: pct > 0 };
}

function Change({ current, previous }: { current: number; previous: number | undefined }) {
  const value = change(current, previous);
  if (!value) return <span style={{ color: MUTED }}>–</span>;
  const arrow = value.up === null ? "" : value.up ? "▲ " : "▼ ";
  const label = value.up === null ? value.text : `${value.up ? "up" : "down"} ${value.text}`;
  return (
    <span style={{ color: SOFT, whiteSpace: "nowrap" }} aria-label={label}>
      {arrow}
      {value.text}
    </span>
  );
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function partialNote(block: MonthBlock) {
  if (block.partial === "start") return `From ${shortDate(block.from)}`;
  if (block.partial === "current") return `So far, to ${shortDate(block.to)}`;
  return null;
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

function MonthBars({
  months,
  metric,
  selected,
  onSelect,
}: {
  months: MonthBlock[];
  metric: (typeof METRICS)[number];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Drawn at its real on-screen width so the axis text stays readable on phones.
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const height = Math.round(Math.min(260, Math.max(180, width * 0.3)));
  const left = CHART.left;
  const right = CHART.right;
  const top = 12;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = niceMax(Math.max(...months.map((block) => block.totals[metric.key]), 1));
  const slot = plotWidth / months.length;
  const barWidth = Math.min(72, slot * 0.56);
  const ticks = [0, max / 2, max];
  const focus = hover ?? selected;
  const focusBlock = months[focus];

  return (
    <div className="relative" ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block" role="img" aria-label={`${metric.label} by month`}>
        <defs>
          <pattern id="month-partial" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(255,128,139,0.35)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={PINK} strokeWidth="2" />
          </pattern>
        </defs>
        {ticks.map((tick) => {
          const y = top + plotHeight - (tick / max) * plotHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={left + plotWidth} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x={left - 8} y={y + 4} textAnchor="end" fill={SOFT} fontSize="11" fontFamily="Arial, sans-serif">
                {formatNumber(tick, metric.money)}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={left + plotWidth} y1={top + plotHeight} y2={top + plotHeight} stroke="rgba(255,255,255,0.25)" />
        {months.map((block, index) => {
          const value = block.totals[metric.key];
          const barHeight = Math.max(value ? 2 : 0, (value / max) * plotHeight);
          const x = left + slot * index + (slot - barWidth) / 2;
          const y = top + plotHeight - barHeight;
          const radius = Math.min(4, barHeight / 2, barWidth / 2);
          return (
            <g key={block.month}>
              <path
                d={`M${x},${top + plotHeight} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + barWidth - radius} Q${x + barWidth},${y} ${x + barWidth},${y + radius} V${top + plotHeight} Z`}
                fill={block.partial ? "url(#month-partial)" : PINK}
                opacity={index === selected ? 1 : 0.72}
                stroke={index === selected ? INK : "none"}
                strokeWidth={index === selected ? 2 : 0}
              />
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fill={index === selected ? INK : SOFT} fontSize="12" fontFamily="Arial, sans-serif">
                {block.short}
              </text>
              {/* Hit area is the whole column, bigger than the bar itself. */}
              <rect
                x={left + slot * index}
                y={top}
                width={slot}
                height={plotHeight + bottom}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(index)}
              >
                <title>{`${block.label}: ${formatNumber(value, metric.money)}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      {hover !== null && focusBlock ? (
        <div
          className="pointer-events-none absolute top-0 rounded-lg px-3 py-2 text-sm"
          style={{
            left: `${((left + slot * focus + slot / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
            background: "#161616",
            color: INK,
            border: "1px solid rgba(255,255,255,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          <strong style={{ color: INK }}>{focusBlock.label}</strong>
          <div style={{ color: INK }}>{formatNumber(focusBlock.totals[metric.key], metric.money)} {metric.label.toLowerCase()}</div>
          <div>
            <Change current={focusBlock.totals[metric.key]} previous={focusBlock.previous?.[metric.key]} />
            {focusBlock.previous ? <span style={{ color: MUTED }}> vs {focusBlock.partial === "current" ? "same days last month" : "the month before"}</span> : null}
          </div>
          {partialNote(focusBlock) ? <div style={{ color: MUTED }}>{partialNote(focusBlock)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function ChannelTable({ block }: { block: MonthBlock }) {
  // One card per channel listing only the figures it actually has, so
  // channels that don't report a measure don't leave gaps or 0s behind.
  const channels = Object.entries(block.bySource)
    .sort(([a], [b]) => sourceOrder(a) - sourceOrder(b))
    .map(([source, totals]) => [source, METRICS.filter(({ key }) => totals[key] > 0), totals] as const)
    .filter(([, columns]) => columns.length);
  if (!channels.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {channels.map(([source, columns, totals]) => (
        <div key={source} className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="mb-2 font-bold" style={{ color: INK }}>{SOURCE_LABELS[source] || source}</div>
          <dl className="space-y-1.5 text-sm" style={{ margin: 0 }}>
            {columns.map((column) => (
              <div key={column.key} className="flex items-baseline justify-between gap-3">
                <dt style={{ color: SOFT }}>{column.label}</dt>
                <dd className="text-right" style={{ margin: 0 }}>
                  <span className="font-bold" style={{ color: INK }}>{formatNumber(totals[column.key], column.money)}</span>
                  {block.previous ? (
                    <span className="ml-2 text-xs">
                      <Change current={totals[column.key]} previous={block.bySourcePrevious[source]?.[column.key] ?? 0} />
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export default function MonthlyHistory({ months }: { months: MonthBlock[] }) {
  const metrics = METRICS.filter(({ key }) => months.some((block) => block.totals[key] > 0));
  const [metricKey, setMetricKey] = useState<MetricKey>(metrics[0]?.key ?? "sessions");
  const [selected, setSelected] = useState(months.length - 1);
  const metric = metrics.find((item) => item.key === metricKey) ?? metrics[0];
  if (!metric || months.length < 2) return null;
  const block = months[selected];
  const current = months.find((item) => item.partial === "current");

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2 block">Over time</span>
        <h2 className="font-serif text-3xl">Month by month</h2>
        <p className="mt-3 max-w-3xl text-[1.02rem] leading-7" style={{ color: SOFT }}>
          How each calendar month compares with the one before.
          {current ? ` ${current.label.split(" ")[0]} is still in progress, so it's compared with the same days of the month before.` : ""}
          {" "}Click a month to see it by channel.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a measure">
        {metrics.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMetricKey(item.key)}
            aria-pressed={item.key === metric.key}
            className="rounded-full px-4 py-2 text-sm"
            style={
              item.key === metric.key
                ? { background: PINK, color: INK, border: `1px solid ${PINK}` }
                : { background: "transparent", color: INK, border: "1px solid rgba(255,255,255,0.25)" }
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mm-card p-5">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-serif text-xl">{metric.label}</h3>
          <span className="text-sm" style={{ color: MUTED }}>
            Striped bars are part months.
          </span>
        </div>
        {metric.note ? <p className="mb-2 text-sm" style={{ color: SOFT }}>{metric.note}</p> : null}
        <MonthBars months={months} metric={metric} selected={selected} onSelect={setSelected} />
        <div
          className="mt-2 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
            paddingLeft: CHART.left,
            paddingRight: CHART.right,
          }}
        >
          {months.map((item, index) => (
            <button
              key={item.month}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={index === selected}
              className="rounded-lg px-1 py-2 text-center text-sm"
              style={{
                background: index === selected ? "rgba(255,128,139,0.14)" : "transparent",
                border: index === selected ? `1px solid ${PINK}` : "1px solid transparent",
                color: INK,
              }}
            >
              <span className="block font-bold" style={{ color: INK }}>{formatNumber(item.totals[metric.key], metric.money)}</span>
              <span className="block text-xs">
                <Change current={item.totals[metric.key]} previous={item.previous?.[metric.key]} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {block ? (
        <div className="mm-card p-5">
          <h3 className="font-serif text-xl">{block.label} by channel</h3>
          <p className="mb-4 text-sm" style={{ color: SOFT }}>
            {partialNote(block) ? `${partialNote(block)}. ` : ""}
            {block.previous
              ? `Arrows compare with ${block.partial === "current" ? "the same days of the month before" : "the month before"}.`
              : "There's no full month before this one to compare with."}
          </p>
          <ChannelTable block={block} />
        </div>
      ) : null}
    </div>
  );
}
