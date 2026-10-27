const DEG = Math.PI / 180;
const LONDON = { lat: 51.5072, lon: -0.1276 };

function londonDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function sunUtcHours(year: number, month: number, day: number, rising: boolean) {
  const { lat, lon } = LONDON;
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const lngHour = lon / 15;
  const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24;
  const mean = 0.9856 * t - 3.289;
  let sun = mean + 1.916 * Math.sin(mean * DEG) + 0.02 * Math.sin(2 * mean * DEG) + 282.634;
  sun = (sun + 360) % 360;
  let rightAscension = Math.atan(0.91764 * Math.tan(sun * DEG)) / DEG;
  rightAscension = (rightAscension + 360) % 360;
  const sunQuarter = Math.floor(sun / 90) * 90;
  const ascentQuarter = Math.floor(rightAscension / 90) * 90;
  rightAscension = (rightAscension + (sunQuarter - ascentQuarter)) / 15;
  const sinDec = 0.39782 * Math.sin(sun * DEG);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosHour =
    (Math.cos(90.833 * DEG) - sinDec * Math.sin(lat * DEG)) / (cosDec * Math.cos(lat * DEG));
  if (cosHour > 1) return 12;
  if (cosHour < -1) return rising ? 0 : 24;
  let hourAngle = Math.acos(cosHour) / DEG;
  if (rising) hourAngle = 360 - hourAngle;
  hourAngle /= 15;
  let universal = (hourAngle + rightAscension - 0.06571 * t - 6.622 - lngHour) % 24;
  if (universal < 0) universal += 24;
  return universal;
}

export function isUkNight(date = new Date()) {
  const { year, month, day } = londonDate(date);
  const sunrise = sunUtcHours(year, month, day, true);
  const sunset = sunUtcHours(year, month, day, false);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return hour < sunrise || hour >= sunset;
}

let cached: { at: number; night: boolean } | null = null;

export function ukNightNow(now = Date.now()) {
  if (cached && now >= cached.at && now - cached.at < 30_000) return cached.night;
  const night = isUkNight(new Date(now));
  cached = { at: now, night };
  return night;
}
