export function formatNumber(value: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

export function formatChange(current: number, previous: number) {
  if (!previous && !current) return "–";
  if (!previous) return "new";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export function formatDateRange(from: string, to: string) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getUTCDate();
  const month = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${month}`;
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

export function formatChartNumber(value: number, prefix = "", duration = false) {
  if (duration) return formatDuration(value);
  if (!value) return `${prefix}0`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (prefix === "£") return `£${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}
