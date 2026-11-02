import { pix, rect } from "@/pixel/game/draw";

export const FRANK_W = 28;
export const FRANK_H = 22;

const FUR = "#e08a3c";
const FUR_DK = "#b86a28";
const CREAM = "#f6e2c4";
const INK = "#2a211c";
const PINK = "#f0a0aa";
const COLLAR = "#ff808b";

export type FrankMode = "walk" | "sit" | "sleep" | "idle" | "perch";

export type FrankState = {
  x: number;
  y: number;
  dir: 1 | -1;
  mode: FrankMode;
  until: number;
  frame: number;
};

export function createFrank(): FrankState {
  return { x: 168, y: 236, dir: 1, mode: "sleep", until: 2800, frame: 0 };
}

export function stepFrank(frank: FrankState, dt: number, calm: boolean) {
  if (calm) {
    frank.mode = "sleep";
    return;
  }
  frank.until -= dt;
  frank.frame += dt;
  if (frank.until <= 0) {
    const roll = Math.random();
    if (roll < 0.45) {
      frank.mode = "walk";
      frank.dir = Math.random() < 0.5 ? -1 : 1;
      frank.until = 1800 + Math.random() * 2200;
    } else if (roll < 0.7) {
      frank.mode = "sit";
      frank.until = 2200 + Math.random() * 2600;
    } else if (roll < 0.9) {
      frank.mode = "sleep";
      frank.until = 2800 + Math.random() * 3200;
    } else {
      frank.mode = "perch";
      frank.x = [36, 130, 224, 318][Math.floor(Math.random() * 4)];
      frank.y = 78;
      frank.until = 4200;
    }
  }
  if (frank.mode === "perch") return;
  if (frank.y < 220) frank.y = 236;
  if (frank.mode === "walk") {
    frank.x += frank.dir * dt * 0.028;
    if (frank.x < 140) {
      frank.x = 140;
      frank.dir = 1;
    }
    if (frank.x > 250) {
      frank.x = 250;
      frank.dir = -1;
    }
  }
}

export const FRANK_LINES = [
  "Frank has approved this meeting by sitting on the agenda.",
  "The cardboard box in the corner remains undefeated.",
  "Frank suggests a break. Frank is rarely wrong.",
  "Purr-formance review: everyone is doing fine.",
  "He blinks slowly. That is a compliment.",
  "The warm spot by the kettle is reserved.",
];

export function drawFrank(ctx: CanvasRenderingContext2D, frank: FrankState) {
  const step = Math.floor(frank.frame / 180) % 2;
  ctx.save();
  // Whole pixels only, or his edges blur when he stops between two.
  const x = Math.round(frank.x);
  const y = Math.round(frank.y);
  if (frank.dir < 0) {
    ctx.translate(x + FRANK_W, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }
  ctx.fillStyle = "rgba(60,30,20,0.2)";
  ctx.fillRect(4, 18, 18, 3);

  if (frank.mode === "sleep") {
    // Curled up: a rounded back, his head resting on his paws and his tail wrapped round the front.
    rect(ctx, 9, 9, 12, 1, FUR);
    rect(ctx, 7, 10, 16, 8, FUR);
    pix(ctx, 14, 10, FUR_DK);
    pix(ctx, 17, 10, FUR_DK);
    pix(ctx, 20, 11, FUR_DK);
    rect(ctx, 2, 9, 9, 8, FUR);
    rect(ctx, 2, 7, 3, 2, FUR);
    rect(ctx, 8, 7, 3, 2, FUR);
    pix(ctx, 3, 8, PINK);
    pix(ctx, 9, 8, PINK);
    rect(ctx, 3, 12, 2, 1, INK);
    rect(ctx, 7, 12, 2, 1, INK);
    pix(ctx, 6, 14, PINK);
    rect(ctx, 4, 15, 5, 2, CREAM);
    rect(ctx, 11, 10, 1, 7, COLLAR);
    rect(ctx, 8, 17, 15, 1, FUR_DK);
    rect(ctx, 22, 14, 2, 4, FUR_DK);
  } else if (frank.mode === "sit" || frank.mode === "perch" || frank.mode === "idle") {
    rect(ctx, 8, 8, 12, 10, FUR);
    rect(ctx, 10, 12, 6, 4, CREAM);
    rect(ctx, 6, 2, 10, 8, FUR);
    rect(ctx, 6, 0, 3, 2, FUR);
    rect(ctx, 13, 0, 3, 2, FUR);
    pix(ctx, 7, 1, PINK);
    pix(ctx, 14, 1, PINK);
    rect(ctx, 8, 5, 2, 2, INK);
    rect(ctx, 12, 5, 2, 2, INK);
    pix(ctx, 8, 5, "#f7efe2");
    pix(ctx, 12, 5, "#f7efe2");
    pix(ctx, 11, 7, PINK);
    rect(ctx, 8, 8, 8, 2, COLLAR);
    pix(ctx, 11, 10, "#e0b15a");
    rect(ctx, 18, 10, 6, 3, FUR_DK);
    rect(ctx, 9, 17, 3, 3, FUR_DK);
    rect(ctx, 15, 17, 3, 3, FUR_DK);
  } else {
    rect(ctx, 6, 8, 14, 7, FUR);
    rect(ctx, 8, 11, 6, 3, CREAM);
    rect(ctx, 4, 4, 8, 7, FUR);
    rect(ctx, 4, 2, 2, 2, FUR);
    rect(ctx, 10, 2, 2, 2, FUR);
    pix(ctx, 4, 3, PINK);
    pix(ctx, 11, 3, PINK);
    rect(ctx, 5, 6, 2, 2, INK);
    rect(ctx, 9, 6, 2, 2, INK);
    pix(ctx, 11, 8, PINK);
    rect(ctx, 5, 9, 6, 2, COLLAR);
    rect(ctx, 18, 8, 7, 3, step ? FUR : FUR_DK);
    rect(ctx, 7, 15, 3, 3, step ? FUR_DK : FUR);
    rect(ctx, 14, 15, 3, 3, step ? FUR : FUR_DK);
    pix(ctx, 8, 10, FUR_DK);
    pix(ctx, 12, 9, FUR_DK);
  }
  ctx.restore();
}
