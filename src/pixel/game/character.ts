import { pix, rect, shade } from "@/pixel/game/draw";
import { hexOf } from "@/pixel/game/options";
import type { Appearance } from "@/pixel/types";

export const CELL_W = 16;
export const CELL_H = 24;

const cache = new Map<string, HTMLCanvasElement>();

function headPixel(x: number, y: number) {
  const rows: Record<number, [number, number]> = {
    3: [6, 9],
    4: [5, 10],
    5: [4, 11],
    6: [4, 11],
    7: [4, 11],
    8: [4, 11],
    9: [5, 10],
    10: [6, 9],
  };
  const span = rows[y];
  return !!span && x >= span[0] && x <= span[1];
}

function faceOpen(x: number, y: number) {
  return y >= 6 && y <= 9 && x >= 6 && x <= 9;
}

function hairPixel(style: Appearance["hair"], x: number, y: number, phase: "back" | "front") {
  if (phase === "back") {
    if (style === "long" && y >= 8 && y <= 20 && (x === 3 || x === 12 || x === 2 || x === 13)) return true;
    if (style === "braids" && y >= 10 && y <= 18 && (x === 3 || x === 12) && y % 2 === 0) return true;
    return false;
  }
  if (style === "pixie") {
    if (y === 2 && x >= 6 && x <= 9) return true;
    if (y === 3 && x >= 5 && x <= 11) return true;
    if (y === 4 && (x === 4 || x === 5 || x === 10 || x === 11)) return true;
    if (y === 5 && (x === 4 || x === 11)) return true;
    return false;
  }
  if (style === "spikes") {
    if (y === 1 && (x === 6 || x === 9)) return true;
    if (y === 2 && (x === 5 || x === 6 || x === 8 || x === 9 || x === 10)) return true;
    if (y >= 3 && y <= 5 && x >= 4 && x <= 11 && !faceOpen(x, y)) return true;
    if (y >= 6 && y <= 7 && (x === 4 || x === 11)) return true;
    return false;
  }
  if (style === "bun") {
    if (y >= 1 && y <= 3 && x >= 10 && x <= 13) return true;
    if (y === 2 && x === 9) return true;
  }
  if (style === "sweep") {
    if (y === 2 && x >= 3 && x <= 8) return true;
    if (y === 3 && x >= 3 && x <= 11) return true;
    if (y === 4 && x >= 3 && x <= 10) return true;
    if (y >= 5 && y <= 8 && (x === 3 || x === 4 || x === 11)) return true;
    if (y === 6 && x === 5) return true;
    return style === "sweep" ? false : false;
  }
  if (style === "curls") {
    if (y >= 2 && y <= 4 && x >= 4 && x <= 11) return true;
    if ((y === 5 || y === 7 || y === 9) && (x === 3 || x === 12)) return true;
    if (y >= 5 && y <= 10 && (x === 4 || x === 11)) return true;
    if (y === 10 && (x === 5 || x === 10)) return true;
    return false;
  }
  if (style === "long") {
    if (y >= 2 && y <= 5 && x >= 4 && x <= 11) return true;
    if (y >= 6 && y <= 11 && (x <= 5 || x >= 10) && headPixel(x, y)) return y < 6 || x <= 5 || x >= 10;
    if (y >= 4 && y <= 9 && (x === 4 || x === 5 || x === 10 || x === 11)) return true;
    return false;
  }
  if (style === "braids") {
    if (y >= 2 && y <= 5 && x >= 5 && x <= 10) return true;
    if (y >= 5 && y <= 8 && (x === 4 || x === 11)) return true;
    if (y === 9 && (x === 4 || x === 11)) return true;
    return false;
  }
  if (y === 2 && x >= 6 && x <= 9) return true;
  if (y === 3 && x >= 4 && x <= 11) return true;
  if (y === 4 && x >= 4 && x <= 11) return true;
  if (y >= 5 && y <= 8 && (x === 3 || x === 4 || x === 11 || x === 12)) return true;
  if (y === 9 && (x === 4 || x === 5 || x === 10 || x === 11)) return true;
  if (style === "bob" && y === 10 && (x === 5 || x === 10)) return true;
  return false;
}

function paint(ctx: CanvasRenderingContext2D, appearance: Appearance, blink: boolean, pose: "stand" | "sit") {
  const skin = hexOf("skin", appearance.skin);
  const skinShadow = shade(skin, -32);
  const hair = hexOf("hair", appearance.hairColour);
  const hairLight = shade(hair, 36);
  const cloth = appearance.outfit === "mm-night" ? "#2c2826" : hexOf("outfit", appearance.outfitColour);
  const clothDark = shade(cloth, -36);
  const clothLight = shade(cloth, 28);
  const shoe = hexOf("shoe", appearance.shoeColour);
  const leg = appearance.outfit === "dress" ? cloth : shade(cloth, -18);

  const putHair = (phase: "back" | "front") => {
    for (let y = 0; y < CELL_H; y += 1) {
      for (let x = 0; x < CELL_W; x += 1) {
        if (!hairPixel(appearance.hair, x, y, phase)) continue;
        if (phase === "front" && faceOpen(x, y) && appearance.hair !== "sweep") continue;
        if (phase === "front" && appearance.hair === "sweep" && faceOpen(x, y) && x > 6) continue;
        pix(ctx, x, y, x < 7 ? hairLight : hair);
      }
    }
  };

  putHair("back");

  const dress = appearance.outfit === "dress";
  const boots = appearance.shoes === "boots";
  const legBottom = pose === "sit" ? 18 : 21;
  if (!dress) {
    for (let y = 18; y <= legBottom; y += 1) {
      if (boots && y >= 20) continue;
      rect(ctx, 5, y, 2, 1, leg);
      rect(ctx, 9, y, 2, 1, leg);
    }
  } else {
    for (let y = 17; y <= (pose === "sit" ? 19 : 21); y += 1) {
      const inset = y === 21 ? 1 : 0;
      rect(ctx, 4 + inset, y, 8 - inset * 2, 1, y % 2 === 0 ? cloth : clothLight);
    }
  }

  if (pose === "stand") {
    if (appearance.shoes === "trainers") {
      rect(ctx, 4, 22, 4, 1, shoe);
      rect(ctx, 8, 22, 4, 1, shoe);
      rect(ctx, 4, 23, 4, 1, "#f7efe2");
      rect(ctx, 8, 23, 4, 1, "#f7efe2");
    } else if (boots) {
      rect(ctx, 4, 20, 4, 4, shoe);
      rect(ctx, 8, 20, 4, 4, shade(shoe, 16));
    } else {
      rect(ctx, 5, 22, 3, 2, shoe);
      rect(ctx, 9, 22, 3, 2, shoe);
    }
  }

  for (let y = 12; y <= 17; y += 1) {
    rect(ctx, 5, y, 6, 1, y === 17 ? clothDark : cloth);
  }
  for (let y = 13; y <= 16; y += 1) {
    pix(ctx, 4, y, clothDark);
    pix(ctx, 11, y, cloth);
  }
  if (appearance.outfit === "blazer" || appearance.outfit === "mm-night") {
    pix(ctx, 7, 13, clothLight);
    pix(ctx, 8, 13, clothLight);
    pix(ctx, 7, 16, clothDark);
    pix(ctx, 8, 16, clothDark);
    if (appearance.outfit === "mm-night") {
      pix(ctx, 7, 14, "#ff808b");
      pix(ctx, 8, 15, "#e0b15a");
    }
  } else if (appearance.outfit === "shirt") {
    pix(ctx, 7, 12, "#f7efe2");
    pix(ctx, 8, 12, "#f7efe2");
    pix(ctx, 8, 14, clothDark);
    pix(ctx, 8, 16, clothDark);
  } else if (appearance.outfit === "hoodie") {
    rect(ctx, 4, 11, 8, 2, clothDark);
    pix(ctx, 3, 12, cloth);
    pix(ctx, 12, 12, cloth);
  } else if (appearance.outfit === "dungarees") {
    rect(ctx, 6, 12, 1, 5, "#243656");
    rect(ctx, 9, 12, 1, 5, "#243656");
    rect(ctx, 5, 16, 6, 2, "#243656");
  }

  rect(ctx, 7, 11, 2, 1, shade(skin, -12));

  for (let y = 3; y <= 10; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (!headPixel(x, y)) continue;
      pix(ctx, x, y, x >= 10 ? skinShadow : skin);
    }
  }
  pix(ctx, 5, 8, shade("#e7a0a8", appearance.skin === "deep" || appearance.skin === "rich" ? -20 : 0));
  pix(ctx, 10, 8, shade("#e7a0a8", -10));

  const eye = hexOf("eye", appearance.eyeColour);
  if (blink) {
    rect(ctx, 5, 7, 2, 1, shade(skin, -40));
    rect(ctx, 9, 7, 2, 1, shade(skin, -40));
  } else if (appearance.eyes === "happy") {
    pix(ctx, 5, 7, "#241816");
    pix(ctx, 6, 6, "#241816");
    pix(ctx, 9, 6, "#241816");
    pix(ctx, 10, 7, "#241816");
  } else if (appearance.eyes === "soft") {
    rect(ctx, 5, 7, 2, 1, "#241816");
    rect(ctx, 9, 7, 2, 1, "#241816");
  } else if (appearance.eyes === "focused") {
    rect(ctx, 5, 6, 2, 2, eye);
    rect(ctx, 9, 6, 2, 2, eye);
    pix(ctx, 6, 7, "#241816");
    pix(ctx, 10, 7, "#241816");
  } else {
    rect(ctx, 5, 6, 2, 2, "#241816");
    rect(ctx, 9, 6, 2, 2, "#241816");
    pix(ctx, 5, 6, eye === "#1c1a19" ? "#8a8078" : eye);
    pix(ctx, 9, 6, "#f7efe2");
    if (appearance.eyes === "lashes") {
      pix(ctx, 4, 6, "#241816");
      pix(ctx, 11, 6, "#241816");
    }
  }
  rect(ctx, 7, 9, 2, 1, shade(skin, -28));

  putHair("front");

  if (appearance.hat === "beanie") {
    rect(ctx, 4, 1, 8, 3, "#2f6a45");
    rect(ctx, 4, 3, 8, 1, "#244e34");
  } else if (appearance.hat === "cap") {
    rect(ctx, 5, 1, 7, 3, "#243656");
    rect(ctx, 8, 3, 6, 1, "#ff808b");
  } else if (appearance.hat === "beret") {
    rect(ctx, 4, 1, 9, 2, "#c45b78");
    rect(ctx, 6, 0, 5, 2, "#a24e62");
  } else if (appearance.hat === "flower") {
    pix(ctx, 11, 3, "#ff808b");
    pix(ctx, 12, 3, "#ff808b");
    pix(ctx, 11, 4, "#ff808b");
    pix(ctx, 12, 2, "#e0b15a");
  }

  if (appearance.accessory === "glasses") {
    rect(ctx, 4, 6, 4, 1, "#2a211c");
    rect(ctx, 8, 6, 4, 1, "#2a211c");
    pix(ctx, 4, 7, "#2a211c");
    pix(ctx, 7, 7, "#2a211c");
    pix(ctx, 8, 7, "#2a211c");
    pix(ctx, 11, 7, "#2a211c");
  } else if (appearance.accessory === "scarf") {
    rect(ctx, 5, 11, 6, 2, "#ff808b");
    pix(ctx, 8, 13, "#e56b78");
    pix(ctx, 9, 14, "#ff808b");
  } else if (appearance.accessory === "earrings") {
    pix(ctx, 4, 9, "#e0b15a");
    pix(ctx, 11, 9, "#e0b15a");
  } else if (appearance.accessory === "headphones") {
    rect(ctx, 4, 3, 8, 1, "#2a211c");
    rect(ctx, 3, 5, 2, 4, "#3a3532");
    rect(ctx, 11, 5, 2, 4, "#3a3532");
    pix(ctx, 3, 6, "#ff808b");
    pix(ctx, 12, 6, "#ff808b");
  }

  const image = ctx.getImageData(0, 0, CELL_W, CELL_H);
  const source = new Uint8ClampedArray(image.data);
  for (let y = 0; y < CELL_H; y += 1) {
    for (let x = 0; x < CELL_W; x += 1) {
      const index = (y * CELL_W + x) * 4;
      if (source[index + 3] > 10) continue;
      let near = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= CELL_W || ny >= CELL_H) continue;
        if (source[(ny * CELL_W + nx) * 4 + 3] > 10) near = true;
      }
      if (near) {
        image.data[index] = 72;
        image.data[index + 1] = 42;
        image.data[index + 2] = 32;
        image.data[index + 3] = 255;
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  appearance: Appearance,
  x: number,
  y: number,
  frame: number,
  pose: "stand" | "sit" = "stand",
  scale = 2,
) {
  const key = `${JSON.stringify(appearance)}|${frame % 2}|${pose}`;
  let sprite = cache.get(key);
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = CELL_W;
    sprite.height = CELL_H;
    const off = sprite.getContext("2d");
    if (!off) return;
    paint(off, appearance, frame % 2 === 1, pose);
    cache.set(key, sprite);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, x | 0, y | 0, CELL_W * scale, CELL_H * scale);
}
