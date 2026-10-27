import { pix, rect } from "@/pixel/game/draw";
import { DESKS, ROOM_H, ROOM_W, screenRect } from "@/pixel/game/layout";
import { ukNightNow } from "@/pixel/game/uk-time";
import type { StaffSlug } from "@/pixel/types";

const PLANK_A = "#c4845c";
const PLANK_B = "#b57148";
const SEAM = "#8d5434";
const WALL = "#f0d2b4";
const WALL_SPECK = "#e4c4a4";
const RAIL = "#7a4b32";
const WOOD = "#a86b42";
const WOOD_LT = "#c4895c";
const WOOD_DK = "#6e432c";
const INK = "#2a2422";

let cached: HTMLCanvasElement | null = null;

function hash(x: number, y: number) {
  return Math.abs((x * 374761393 + y * 668265263) | 0);
}

function drawStatic(ctx: CanvasRenderingContext2D) {
  rect(ctx, 0, 0, ROOM_W, 64, WALL);
  for (let y = 8; y < 52; y += 7) {
    for (let x = 6; x < ROOM_W; x += 11) {
      if (hash(x, y) % 4 === 0) pix(ctx, x, y, WALL_SPECK);
    }
  }
  rect(ctx, 0, 52, ROOM_W, 6, "#f7e6d2");
  rect(ctx, 0, 58, ROOM_W, 8, RAIL);
  rect(ctx, 0, 66, ROOM_W, 3, WOOD_DK);

  for (let y = 70; y < ROOM_H - 4; y += 8) {
    const alt = Math.floor(y / 8) % 2 === 0;
    rect(ctx, 4, y, ROOM_W - 8, 7, alt ? PLANK_A : PLANK_B);
    rect(ctx, 4, y + 7, ROOM_W - 8, 1, SEAM);
    const shift = (y * 3) % 30;
    for (let x = 8 + shift; x < ROOM_W - 8; x += 42) rect(ctx, x, y, 1, 7, "#a8643c");
    const knotX = 20 + (hash(0, y) % 300);
    pix(ctx, knotX, y + 3, "#8a4e30");
    pix(ctx, knotX + 1, y + 3, "#8a4e30");
  }
  rect(ctx, 0, ROOM_H - 4, ROOM_W, 4, WOOD_DK);
  rect(ctx, 0, 68, 4, ROOM_H - 68, WOOD_DK);
  rect(ctx, ROOM_W - 4, 68, 4, ROOM_H - 68, WOOD_DK);

  drawShelf(ctx, 8, 8);
  drawSign(ctx, 168, 46);
  drawRug(ctx, 124, 150, 148, 74);
  drawBoard(ctx, 8, 156);
  drawTable(ctx, 136, 158);
  drawSofa(ctx, 8, 232);
  drawCoffee(ctx, 286, 216);
  drawPlant(ctx, 118, 214, "leaf");
  drawPlant(ctx, 232, 224, "leaf");
  drawPlant(ctx, 252, 86, "cactus");
  for (const desk of DESKS) drawDesk(ctx, desk.x, desk.y);
}

function drawShelf(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y, 70, 50, WOOD_DK);
  rect(ctx, x + 3, y + 3, 64, 44, "#8d5a3c");
  const colours = ["#e25b6a", "#2f7c8a", "#f3e6cf", "#d4a054", "#6b5b95", "#3e7a45", "#ff808b", "#243656"];
  colours.forEach((colour, index) => rect(ctx, x + 6 + (index % 8) * 7, y + 6, 5, 16, colour));
  colours.forEach((colour, index) => {
    if (index > 6) return;
    rect(ctx, x + 8 + index * 8, y + 28, 6, 14, colours[(index + 3) % colours.length]);
  });
}

function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y, 44, 12, "#2a160f");
  // Two M marks. A filled top reads as A, so the valley stays open.
  const rows = ["110000011", "111000111", "110101011", "110010011", "110000011", "110000011", "110000011", "110000011", "110000011", "110000011"];
  const drawM = (ox: number) => {
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx += 1) {
        if (row[rx] === "1") pix(ctx, x + ox + rx, y + 1 + ry, "#ff808b");
      }
    });
  };
  drawM(11);
  drawM(24);
}

function drawRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, "#8c4a55");
  rect(ctx, x + 3, y + 3, w - 6, h - 6, "#f0d2cb");
  for (let yy = y + 8; yy < y + h - 8; yy += 10) {
    for (let xx = x + 8; xx < x + w - 8; xx += 10) rect(ctx, xx, yy, 4, 4, "#c96b78");
  }
  rect(ctx, x + 3, y + 3, w - 6, 2, "#c96b78");
  rect(ctx, x + 3, y + h - 5, w - 6, 2, "#c96b78");
}

function drawBoard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 46, y + 60, 6, 10, WOOD_DK);
  rect(ctx, x, y, 100, 62, WOOD_DK);
  rect(ctx, x + 4, y + 4, 92, 54, "#d7b07a");
  const notes = ["#fffaf3", "#ffd0d4", "#d9f0ea", "#ffe6b8"];
  notes.forEach((colour, index) => {
    const nx = x + 8 + (index % 2) * 44;
    const ny = y + 8 + Math.floor(index / 2) * 26;
    rect(ctx, nx, ny, 38, 20, colour);
    rect(ctx, nx + 16, ny - 1, 4, 3, index % 2 ? "#2f7c8a" : "#e25b6a");
    rect(ctx, nx + 4, ny + 6, 28, 2, "rgba(90,60,40,0.25)");
    rect(ctx, nx + 4, ny + 10, 20, 2, "rgba(90,60,40,0.2)");
    rect(ctx, nx + 4, ny + 14, 24, 2, "rgba(90,60,40,0.2)");
  });
}

function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 10, y + 36, 6, 12, WOOD_DK);
  rect(ctx, x + 108, y + 36, 6, 12, WOOD_DK);
  rect(ctx, x + 6, y + 12, 112, 28, WOOD);
  rect(ctx, x + 6, y + 12, 112, 4, WOOD_LT);
  rect(ctx, x + 10, y + 18, 104, 16, "#9a6844");
  const mugs = ["#e25b6a", "#2f7c8a", "#d4a054", "#6b5b95"];
  mugs.forEach((colour, index) => {
    rect(ctx, x + 18 + index * 22, y + 22, 8, 7, colour);
    rect(ctx, x + 25 + index * 22, y + 24, 3, 3, colour);
  });
  rect(ctx, x + 52, y + 16, 18, 10, "#f7efe2");
  rect(ctx, x + 54, y + 18, 12, 1, "#e2d2c2");
}

function drawSofa(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 4, y + 28, 8, 8, WOOD_DK);
  rect(ctx, x + 104, y + 28, 8, 8, WOOD_DK);
  rect(ctx, x, y + 8, 116, 26, WOOD_DK);
  rect(ctx, x + 4, y + 12, 108, 16, "#a85a62");
  rect(ctx, x + 8, y + 14, 30, 12, "#ff808b");
  rect(ctx, x + 42, y + 14, 30, 12, "#7d9a78");
  rect(ctx, x + 76, y + 14, 30, 12, "#f3e6cf");
  rect(ctx, x, y + 6, 8, 20, "#5c3828");
  rect(ctx, x + 108, y + 6, 8, 20, "#5c3828");
}

function drawCoffee(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y + 24, 90, 28, "#8d5a3c");
  rect(ctx, x, y + 24, 90, 5, WOOD_LT);
  rect(ctx, x + 4, y + 48, 6, 6, WOOD_DK);
  rect(ctx, x + 78, y + 48, 6, 6, WOOD_DK);
  rect(ctx, x + 8, y + 6, 22, 20, INK);
  rect(ctx, x + 12, y + 10, 14, 8, "#7eb6d6");
  pix(ctx, x + 14, y + 18, "#c45b78");
  rect(ctx, x + 36, y + 12, 16, 12, "#d7d2cc");
  rect(ctx, x + 40, y + 8, 8, 4, "#b7b2ac");
  rect(ctx, x + 58, y + 18, 8, 7, "#f7efe2");
  rect(ctx, x + 70, y + 18, 8, 7, "#ff808b");
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, kind: "leaf" | "cactus") {
  if (kind === "cactus") {
    rect(ctx, x + 5, y + 6, 6, 14, "#3e7a45");
    rect(ctx, x + 1, y + 10, 5, 6, "#4e8a52");
    rect(ctx, x + 10, y + 8, 5, 6, "#2f6a3a");
    pix(ctx, x + 3, y + 10, "#e7e2c8");
    rect(ctx, x + 3, y + 20, 12, 6, "#c46a4a");
    return;
  }
  rect(ctx, x + 4, y, 8, 6, "#2f6a3e");
  rect(ctx, x, y + 4, 8, 8, "#3f8a4e");
  rect(ctx, x + 8, y + 6, 8, 8, "#67a85a");
  pix(ctx, x + 6, y + 6, "#1f4a2c");
  pix(ctx, x + 11, y + 9, "#1f4a2c");
  rect(ctx, x + 6, y + 14, 4, 6, WOOD_DK);
  rect(ctx, x + 2, y + 20, 12, 6, "#c46a4a");
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 8, y + 40, 4, 10, WOOD_DK);
  rect(ctx, x + 68, y + 40, 4, 10, WOOD_DK);
  rect(ctx, x + 4, y + 26, 76, 16, WOOD);
  rect(ctx, x + 4, y + 26, 76, 3, WOOD_LT);
  rect(ctx, x + 8, y + 32, 68, 6, "#8d5a36");
  rect(ctx, x + 24, y + 2, 34, 26, INK);
  rect(ctx, x + 26, y + 4, 30, 20, "#172033");
  rect(ctx, x + 36, y + 28, 10, 4, INK);
  rect(ctx, x + 14, y + 34, 30, 5, "#3a3532");
  for (let i = 0; i < 5; i += 1) pix(ctx, x + 17 + i * 5, y + 36, "#6a6560");
  rect(ctx, x + 62, y + 32, 8, 7, "#f7efe2");
  rect(ctx, x + 69, y + 34, 3, 3, "#f7efe2");
  rect(ctx, x + 30, y + 44, 22, 8, "#8d5a40");
  rect(ctx, x + 28, y + 50, 26, 6, WOOD_DK);
}

export function staticRoom() {
  if (cached) return cached;
  cached = document.createElement("canvas");
  cached.width = ROOM_W;
  cached.height = ROOM_H;
  const ctx = cached.getContext("2d");
  if (!ctx) return cached;
  drawStatic(ctx);
  return cached;
}

export function clearRoomCache() {
  cached = null;
}

const NIGHT_STARS: [number, number][][] = [
  [[8, 7], [15, 11], [9, 20], [32, 18]],
  [[8, 9], [34, 8], [12, 21], [33, 20]],
  [[7, 8], [14, 20], [30, 9], [35, 19]],
];

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, evening: boolean, calm: boolean, pane: number) {
  rect(ctx, x, y, 44, 34, "#f4efe6");
  rect(ctx, x + 3, y + 3, 38, 24, evening ? "#1e3154" : "#7ea0d0");
  if (evening) {
    if (pane === 1) {
      rect(ctx, x + 27, y + 6, 4, 4, "#f7efe2");
      pix(ctx, x + 30, y + 6, "#1e3154");
    }
    NIGHT_STARS[pane]?.forEach(([sx, sy], index) => {
      const lit = calm || Math.floor(time / 500 + index + pane) % 6 !== 0;
      if (lit) pix(ctx, x + sx, y + sy, index % 2 ? "#d7e2f4" : "#f7efe2");
    });
  } else {
    const shift = calm ? 8 : Math.floor(time / 160) % 18;
    rect(ctx, x + 6 + shift, y + 8, 12, 4, "#f7f3ea");
    rect(ctx, x + 9 + shift, y + 6, 6, 3, "#ffffff");
    if (!calm && Math.floor(time / 400) % 7 === 0) {
      pix(ctx, x + 8 + (Math.floor(time / 80) % 20), y + 16, "#2a2422");
      pix(ctx, x + 10 + (Math.floor(time / 80) % 20), y + 16, "#2a2422");
    }
  }
  rect(ctx, x + 21, y + 3, 2, 24, "#f4efe6");
  rect(ctx, x + 3, y + 14, 38, 2, "#f4efe6");
  rect(ctx, x - 2, y + 30, 48, 4, WOOD_DK);
}

function drawHand(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, length: number, colour: string) {
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  for (let step = 1; step <= length; step += 1) {
    pix(ctx, Math.round(cx + dx * step), Math.round(cy + dy * step), colour);
  }
}

function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, now: Date) {
  rect(ctx, x, y, 20, 20, "#f7efe2");
  rect(ctx, x + 2, y + 2, 16, 16, INK);
  const cx = x + 10;
  const cy = y + 10;
  for (const [tx, ty] of [[0, -7], [7, 0], [0, 7], [-7, 0]] as const) pix(ctx, cx + tx, cy + ty, "#d7c4b0");
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const hourAngle = (((now.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2;
  const minuteAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2;
  drawHand(ctx, cx, cy, hourAngle, 5, "#ffd27a");
  drawHand(ctx, cx, cy, minuteAngle, 7, "#f7efe2");
  pix(ctx, cx, cy, "#ff808b");
}

function paintScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: number,
  frame: number,
  offline: boolean,
) {
  if (offline) {
    rect(ctx, x, y, w, h, "#141b2a");
    rect(ctx, x + w - 8, y + 3, 3, 3, "#f3e6cf");
    return;
  }
  const backgrounds = ["#1c3044", "#243044", "#1e2c2a", "#34243a"];
  rect(ctx, x, y, w, h, backgrounds[variant % 4]);
  const kind = variant % 4;
  if (kind === 0) {
    for (let i = 0; i < 4; i += 1) {
      const bar = 3 + ((i + frame) % 4) * 2;
      rect(ctx, x + 3 + i * 6, y + h - bar - 2, 4, bar, i === frame % 4 ? "#ffd0d4" : "#ff808b");
    }
  } else if (kind === 1) {
    rect(ctx, x + 2, y + 2, w - 4, 3, "#f7efe2");
    rect(ctx, x + 2, y + 7, w - 8, 2, "#8ec4e0");
    rect(ctx, x + 2, y + 11, w - 10, 2, "#8ec4e0");
  } else if (kind === 2) {
    rect(ctx, x + 3, y + 3, 6, 6, "#7dba6a");
    rect(ctx, x + 12, y + 4, 12, 2, "#f7efe2");
    rect(ctx, x + 12, y + 8, 8, 2, "#c9ddd0");
  } else {
    rect(ctx, x + 8, y + 4, 4, 4, "#ff808b");
    rect(ctx, x + 13, y + 4, 4, 4, "#ff808b");
    rect(ctx, x + 10, y + 7, 6, 4, "#ff808b");
  }
}

export function drawAnimated(
  ctx: CanvasRenderingContext2D,
  time: number,
  options: { evening?: boolean; calm?: boolean; offline?: Partial<Record<StaffSlug, boolean>> },
) {
  const evening = options.evening ?? ukNightNow();
  const calm = options.calm ?? false;
  drawWindow(ctx, 86, 10, time, evening, calm, 0);
  drawWindow(ctx, 140, 10, time + 400, evening, calm, 1);
  drawWindow(ctx, 194, 10, time + 800, evening, calm, 2);

  // Right window sill ends at 240. Calendar starts at 286. The clock sits in the middle.
  drawClock(ctx, 253, 12, new Date());

  const frame = calm ? 1 : Math.floor(time / 700) % 4;
  DESKS.forEach((desk, index) => {
    const screen = screenRect(desk);
    paintScreen(ctx, screen.x, screen.y, screen.w, screen.h, index + frame, frame, Boolean(options.offline?.[desk.slug]));
    if (!options.offline?.[desk.slug]) {
      const accent = ["#e25b6a", "#2f7c8a", "#d4a054", "#6b5b95"][index];
      rect(ctx, desk.x + 62, desk.y + 32, 8, 7, accent);
    }
  });

  const puff = calm ? 0 : Math.floor(time / 180) % 5;
  pix(ctx, 330, 214 - puff, "rgba(255,255,255,0.8)");
  pix(ctx, 332, 210 - puff, "rgba(255,255,255,0.55)");

  for (let x = 16; x < ROOM_W - 8; x += 18) {
    const on = calm || Math.floor(time / 500 + x) % 5 !== 0;
    rect(ctx, x, 4, 2, 2, on ? "#ffd7a1" : "#c4895c");
    pix(ctx, x, 6, WOOD_DK);
  }

  const calendarX = 286;
  const calendarY = 8;
  rect(ctx, calendarX, calendarY, 90, 50, "#f7efe2");
  rect(ctx, calendarX, calendarY, 90, 12, "#ff808b");
  rect(ctx, calendarX + 8, calendarY + 3, 18, 6, "#fff");
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const marked = (row + col) % 6 === 0;
      rect(ctx, calendarX + 6 + col * 12, calendarY + 16 + row * 8, 8, 6, marked ? "#ffd0d4" : "#ead8c6");
    }
  }
}
