function ordinal(day: number) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatLongDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getUTCDate();
  const month = date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
  return `${ordinal(day)} of ${month} ${date.getUTCFullYear()}`;
}

export function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getUTCDate();
  const month = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return `${ordinal(day)} ${month}`;
}

export function formatDateRange(from: string, to: string) {
  return `${formatLongDate(from)} to ${formatLongDate(to)}`;
}
