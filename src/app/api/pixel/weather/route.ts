import { NextResponse } from "next/server";
import { CALM_WEATHER, weatherFromCode, type Weather } from "@/pixel/game/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Exeter's current weather for the pixel office windows, from Open-Meteo (free,
// no key). Kept for 15 minutes so every open office shares one lookup.
const EXETER = "latitude=50.7184&longitude=-3.5339";
const KEEP_MS = 15 * 60 * 1000;
let kept: { at: number; weather: Weather } | null = null;

export async function GET() {
  if (!kept || Date.now() - kept.at > KEEP_MS) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${EXETER}&current=weather_code,cloud_cover,wind_speed_10m&timezone=Europe%2FLondon`,
        { signal: AbortSignal.timeout(5000), cache: "no-store" },
      );
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { current?: { weather_code?: number; cloud_cover?: number; wind_speed_10m?: number } };
      const now = data.current ?? {};
      kept = { at: Date.now(), weather: weatherFromCode(Number(now.weather_code ?? 0), Number(now.cloud_cover ?? 0), Number(now.wind_speed_10m ?? 0)) };
    } catch {
      // Keep the last good weather if there is one; otherwise a clear sky.
      if (!kept) return NextResponse.json(CALM_WEATHER, { headers: { "cache-control": "no-store" } });
    }
  }
  return NextResponse.json(kept.weather, { headers: { "cache-control": "public, max-age=300" } });
}
