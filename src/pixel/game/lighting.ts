import { DESKS, ROOM_H, ROOM_W, screenRect } from "@/pixel/game/layout";
import type { Daylight } from "@/pixel/game/uk-time";
import type { Weather } from "@/pixel/game/weather";
import type { StaffSlug } from "@/pixel/types";

// The light over the whole room, drawn on top of the room and the people in it:
// sunbeams and golden hour by day, grey light in bad weather, and after dark a
// dim room lit by desk lamps, monitors and the string lights.

const WINDOWS = [86, 140, 194];
// The darkest the room gets, so it stays easy to see at night.
const NIGHT = 0.6;

let lightMap: HTMLCanvasElement | null = null;

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colour: string, strength: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, colour.replace("A", String(strength)));
  gradient.addColorStop(1, colour.replace("A", "0"));
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export type LightSources = {
  /** Desks whose person is online: their lamp and monitor are on. */
  online: Partial<Record<StaffSlug, boolean>>;
  /** Extra moving lights, for a party. */
  party?: { x: number; y: number; colour: string }[];
};

export function drawLighting(ctx: CanvasRenderingContext2D, light: Daylight, weather: Weather, time: number, calm: boolean, sources: LightSources) {
  const wet = weather.kind === "rain" || weather.kind === "storm" || weather.kind === "snow";
  const dull = wet || weather.kind === "overcast" || weather.kind === "fog";
  const day = 1 - light.darkness;

  ctx.save();

  // Sunbeams from the windows, slanting with the sun: from the left in the
  // morning, from the right in the afternoon. Softer when it's cloudy.
  const sunny = weather.kind === "clear" ? 1 : weather.kind === "cloudy" ? 0.45 : 0;
  if (sunny > 0 && day > 0.05) {
    const lean = (light.sun - 0.5) * -120;
    const strength = 0.14 * sunny * day * (1 + light.warmth * 0.8);
    const colour = light.warmth > 0.3 ? "255, 214, 150" : "255, 244, 214";
    for (const wx of WINDOWS) {
      const gradient = ctx.createLinearGradient(0, 40, 0, 190);
      gradient.addColorStop(0, `rgba(${colour}, ${strength})`);
      gradient.addColorStop(1, `rgba(${colour}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(wx + 3, 40);
      ctx.lineTo(wx + 41, 40);
      ctx.lineTo(wx + 41 + lean, 190);
      ctx.lineTo(wx + 3 + lean, 190);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Golden hour: a warm wash over everything.
  if (light.warmth > 0.02 && !dull) {
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = `rgba(255, 150, 60, ${0.7 * light.warmth})`;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(255, 140, 70, ${0.09 * light.warmth})`;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  }

  // Grey days are a little flatter and cooler.
  if (dull && day > 0) {
    ctx.fillStyle = `rgba(70, 82, 104, ${(weather.kind === "storm" ? 0.16 : wet ? 0.11 : 0.07) * day})`;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  }

  // After dark (and a little on stormy days), dim the room and cut holes for the lights.
  const darkness = Math.min(1, light.darkness + (weather.kind === "storm" ? 0.15 : 0) + (sources.party?.length ? 0.35 : 0));
  if (darkness > 0.02) {
    if (!lightMap) {
      lightMap = document.createElement("canvas");
      lightMap.width = ROOM_W;
      lightMap.height = ROOM_H;
    }
    const map = lightMap.getContext("2d");
    if (map) {
      map.globalCompositeOperation = "source-over";
      map.clearRect(0, 0, ROOM_W, ROOM_H);
      map.fillStyle = `rgba(14, 18, 44, ${NIGHT * darkness})`;
      map.fillRect(0, 0, ROOM_W, ROOM_H);
      map.globalCompositeOperation = "destination-out";
      const flicker = calm ? 1 : 0.94 + Math.sin(time / 900) * 0.04;
      DESKS.forEach((desk) => {
        if (!sources.online[desk.slug]) return;
        glow(map, desk.x + 10, desk.y + 26, 58 * flicker, "rgba(0,0,0,A)", 0.95);
        const screen = screenRect(desk);
        glow(map, screen.x + screen.w / 2, screen.y + screen.h / 2 + 10, 34, "rgba(0,0,0,A)", 0.7);
      });
      for (let x = 16; x < ROOM_W - 8; x += 18) glow(map, x + 1, 6, 14, "rgba(0,0,0,A)", 0.55);
      glow(map, 304, 232, 22, "rgba(0,0,0,A)", 0.6);
      for (const spot of sources.party ?? []) glow(map, spot.x, spot.y, 60, "rgba(0,0,0,A)", 0.9);
      ctx.drawImage(lightMap, 0, 0);
    }

    // Coloured light on top: warm lamps, cool monitors, the coffee machine and party lights.
    ctx.globalCompositeOperation = "lighter";
    DESKS.forEach((desk) => {
      if (!sources.online[desk.slug]) return;
      glow(ctx, desk.x + 10, desk.y + 20, 40, "rgba(255, 180, 90, A)", 0.32 * darkness);
      const screen = screenRect(desk);
      glow(ctx, screen.x + screen.w / 2, screen.y + screen.h / 2 + 6, 26, "rgba(110, 160, 255, A)", 0.22 * darkness);
    });
    glow(ctx, 304, 228, 14, "rgba(126, 182, 214, A)", 0.25 * darkness);
    for (const spot of sources.party ?? []) glow(ctx, spot.x, spot.y, 58, spot.colour, 0.55);
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.restore();
}
