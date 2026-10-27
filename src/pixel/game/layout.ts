import type { StaffSlug } from "@/pixel/types";

export const ROOM_W = 384;
export const ROOM_H = 288;

export const DESKS: { slug: StaffSlug; x: number; y: number }[] = [
  { slug: "max", x: 8, y: 72 },
  { slug: "tash", x: 102, y: 72 },
  { slug: "mariette", x: 196, y: 72 },
  { slug: "natasha", x: 290, y: 72 },
];

export const SEATS: Record<StaffSlug, { x: number; y: number }> = {
  max: { x: 48, y: 140 },
  tash: { x: 142, y: 140 },
  mariette: { x: 236, y: 140 },
  natasha: { x: 330, y: 140 },
};

export const SOFA_SPOTS = [
  { x: 31, y: 260 },
  { x: 65, y: 260 },
  { x: 99, y: 260 },
];

export const HOTSPOTS = [
  { id: "shelf", label: "Project shelf", x: 8, y: 8, w: 72, h: 52, action: "projects" as const },
  { id: "calendar", label: "Wall calendar", x: 286, y: 8, w: 90, h: 50, action: "calendar" as const },
  { id: "desk-max", label: "Max's desk", x: 8, y: 68, w: 86, h: 70, action: "desk" as const, slug: "max" as const },
  { id: "desk-tash", label: "Tash's desk", x: 102, y: 68, w: 86, h: 70, action: "desk" as const, slug: "tash" as const },
  { id: "desk-mariette", label: "Mariette's desk", x: 196, y: 68, w: 86, h: 70, action: "desk" as const, slug: "mariette" as const },
  { id: "desk-natasha", label: "Natasha's desk", x: 290, y: 68, w: 86, h: 70, action: "desk" as const, slug: "natasha" as const },
  { id: "board", label: "Task noticeboard", x: 8, y: 156, w: 100, h: 64, action: "team" as const },
  { id: "table", label: "Meeting table", x: 136, y: 158, w: 124, h: 56, action: "meetings" as const },
  { id: "lounge", label: "Lounge sofa", x: 8, y: 232, w: 118, h: 46, action: "lounge" as const },
  { id: "coffee", label: "Coffee corner", x: 286, y: 216, w: 90, h: 62, action: "coffee" as const },
];

export const BLOCKS = [
  { x: 8, y: 72, w: 86, h: 56 },
  { x: 102, y: 72, w: 86, h: 56 },
  { x: 196, y: 72, w: 86, h: 56 },
  { x: 290, y: 72, w: 86, h: 56 },
  { x: 8, y: 156, w: 100, h: 64 },
  { x: 136, y: 162, w: 124, h: 48 },
  { x: 8, y: 236, w: 118, h: 44 },
  { x: 286, y: 224, w: 90, h: 56 },
];

export function screenRect(desk: { x: number; y: number }) {
  return { x: desk.x + 28, y: desk.y + 8, w: 28, h: 14 };
}
