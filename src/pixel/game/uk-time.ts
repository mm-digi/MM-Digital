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

export type Daylight = {
  /** 0 in daylight, 1 at full night, ramping through dawn and dusk. */
  darkness: number;
  /** 0 to 1: how golden the light is, strongest just after sunrise and before sunset. */
  warmth: number;
  /** 0 at sunrise to 1 at sunset: where the sun is, for the angle of the sunbeams. */
  sun: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

// How light the office is right now, from today's real UK sunrise and sunset.
export function ukDaylight(date = new Date()): Daylight {
  const { year, month, day } = londonDate(date);
  const sunrise = sunUtcHours(year, month, day, true);
  const sunset = sunUtcHours(year, month, day, false);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  // Light ramps over about 45 minutes either side: dark before dawn, light after.
  const morning = clamp01((hour - (sunrise - 0.5)) / 1);
  const evening = clamp01(((sunset + 0.6) - hour) / 1.1);
  const darkness = 1 - Math.min(morning, evening);
  const afterRise = clamp01(1 - (hour - sunrise) / 1.5);
  const beforeSet = clamp01(1 - (sunset - hour) / 2);
  const warmth = (hour >= sunrise - 0.5 && hour <= sunset + 0.6 ? Math.max(afterRise, beforeSet) : 0) * (1 - darkness * 0.6);
  return { darkness, warmth, sun: clamp01((hour - sunrise) / Math.max(1, sunset - sunrise)) };
}

let daylightCache: { at: number; light: Daylight } | null = null;

export function ukDaylightNow(now = Date.now()) {
  if (daylightCache && now >= daylightCache.at && now - daylightCache.at < 20_000) return daylightCache.light;
  const light = ukDaylight(new Date(now));
  daylightCache = { at: now, light };
  return light;
}
