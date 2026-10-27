import { BLOCKS, ROOM_H, ROOM_W } from "@/pixel/game/layout";

const STEP = 8;

export function isBlocked(x: number, y: number) {
  if (x < 10 || y < 136 || x > ROOM_W - 12 || y > ROOM_H - 12) return true;
  return BLOCKS.some((block) => x >= block.x && x <= block.x + block.w && y >= block.y && y <= block.y + block.h);
}

export function findPath(start: { x: number; y: number }, goal: { x: number; y: number }) {
  const sx = Math.round(start.x / STEP);
  const sy = Math.round(start.y / STEP);
  let gx = Math.round(goal.x / STEP);
  let gy = Math.round(goal.y / STEP);
  if (isBlocked(gx * STEP, gy * STEP)) {
    let found = false;
    for (let radius = 1; radius <= 6 && !found; radius += 1) {
      for (let dy = -radius; dy <= radius && !found; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          if (!isBlocked((gx + dx) * STEP, (gy + dy) * STEP)) {
            gx += dx;
            gy += dy;
            found = true;
            break;
          }
        }
      }
    }
    if (!found) return [];
  }

  const key = (x: number, y: number) => `${x},${y}`;
  const queue: [number, number][] = [[sx, sy]];
  const previous = new Map<string, string | null>([[key(sx, sy), null]]);
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (queue.length) {
    const [x, y] = queue.shift() as [number, number];
    if (x === gx && y === gy) break;
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const nextKey = key(nx, ny);
      if (previous.has(nextKey)) continue;
      if (isBlocked(nx * STEP, ny * STEP)) continue;
      previous.set(nextKey, key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!previous.has(key(gx, gy))) return [];
  const path: { x: number; y: number }[] = [];
  let cursor: string | null = key(gx, gy);
  while (cursor) {
    const [x, y] = cursor.split(",").map(Number);
    path.push({ x: x * STEP, y: y * STEP });
    cursor = previous.get(cursor) ?? null;
  }
  path.reverse();
  return path;
}
