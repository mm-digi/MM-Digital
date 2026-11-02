// The weather outside the office windows: Exeter's real weather, simplified
// into the handful of looks the windows can draw.

export type WeatherKind = "clear" | "cloudy" | "overcast" | "fog" | "rain" | "snow" | "storm";

export type Weather = {
  kind: WeatherKind;
  /** Heavier rain or snow draws more of it. */
  heavy: boolean;
  /** Wind in km/h, which slants the rain and snow. */
  wind: number;
};

export const CALM_WEATHER: Weather = { kind: "clear", heavy: false, wind: 0 };

// WMO weather codes, as Open-Meteo reports them.
export function weatherFromCode(code: number, cloudCover: number, wind: number): Weather {
  const w = Math.max(0, Math.min(80, Number.isFinite(wind) ? wind : 0));
  if (code >= 95) return { kind: "storm", heavy: true, wind: w };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { kind: "snow", heavy: code === 75 || code === 86, wind: w };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { kind: "rain", heavy: [65, 67, 82].includes(code), wind: w };
  }
  if (code === 45 || code === 48) return { kind: "fog", heavy: false, wind: w };
  if (code === 3 || cloudCover >= 85) return { kind: "overcast", heavy: false, wind: w };
  if (code === 2 || cloudCover >= 40) return { kind: "cloudy", heavy: false, wind: w };
  return { kind: "clear", heavy: false, wind: w };
}
