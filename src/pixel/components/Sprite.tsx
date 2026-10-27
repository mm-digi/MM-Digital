"use client";

import { useEffect, useRef } from "react";
import { CELL_H, CELL_W, drawCharacter } from "@/pixel/game/character";
import type { Appearance } from "@/pixel/types";

export function Sprite({
  appearance,
  scale = 4,
  animate = true,
}: {
  appearance: Appearance;
  scale?: number;
  animate?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let timer = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCharacter(ctx, appearance, 0, 0, frame, "stand", scale);
    };
    draw();
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = window.setInterval(() => {
      frame = frame ? 0 : 1;
      draw();
    }, 700);
    return () => window.clearInterval(timer);
  }, [appearance, scale, animate]);

  return (
    <canvas
      ref={ref}
      width={CELL_W * scale}
      height={CELL_H * scale}
      className="sprite"
      aria-hidden="true"
    />
  );
}
