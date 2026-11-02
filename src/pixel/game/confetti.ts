import { ROOM_W } from "@/pixel/game/layout";

// Confetti for celebrations: a burst over someone who has just finished a
// quest, and a gentle fall from the ceiling during a Friday party.

const COLOURS = ["#ff808b", "#ffe08a", "#7dba6a", "#8ec4e0", "#9b7fd1", "#f7efe2", "#e0b15a"];

type Bit = { x: number; y: number; vx: number; vy: number; colour: string; life: number; spin: number };

const bits: Bit[] = [];

export function burst(x: number, y: number, count = 80) {
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = 0.035 + Math.random() * 0.06;
    bits.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      colour: COLOURS[i % COLOURS.length],
      life: 1700 + Math.random() * 900,
      spin: Math.random() * 1000,
    });
  }
}

export function sprinkle(count: number) {
  for (let i = 0; i < count; i += 1) {
    bits.push({
      x: Math.random() * ROOM_W,
      y: -4,
      vx: (Math.random() - 0.5) * 0.02,
      vy: 0.02 + Math.random() * 0.03,
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      life: 6000,
      spin: Math.random() * 1000,
    });
  }
}

export function hasConfetti() {
  return bits.length > 0;
}

export function stepAndDrawConfetti(ctx: CanvasRenderingContext2D, dt: number, time: number) {
  for (let i = bits.length - 1; i >= 0; i -= 1) {
    const bit = bits[i];
    bit.life -= dt;
    if (bit.life <= 0 || bit.y > 300) {
      bits.splice(i, 1);
      continue;
    }
    bit.vy += 0.00012 * dt;
    bit.vx *= 0.99;
    bit.vy = Math.min(bit.vy, 0.045);
    bit.x += bit.vx * dt;
    bit.y += bit.vy * dt;
    // Each piece flips as it falls: wide, then thin.
    const wide = Math.floor((time + bit.spin) / 140) % 2 === 0;
    ctx.globalAlpha = Math.min(1, bit.life / 400);
    ctx.fillStyle = bit.colour;
    ctx.fillRect(Math.round(bit.x), Math.round(bit.y), wide ? 3 : 1, wide ? 1 : 3);
  }
  ctx.globalAlpha = 1;
}
