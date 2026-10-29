"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { drawCharacter } from "@/pixel/game/character";
import { createFrank, drawFrank, FRANK_H, FRANK_LINES, FRANK_W, stepFrank, type FrankState } from "@/pixel/game/frank";
import { HOTSPOTS, ROOM_H, ROOM_W, SEATS, SOFA_SPOTS } from "@/pixel/game/layout";
import { drawAnimated, staticRoom } from "@/pixel/game/room";
import { findPath } from "@/pixel/game/walk";
import { EMOTES, statusLabel } from "@/pixel/game/options";
import type { StaffPublic, StaffSlug } from "@/pixel/types";

type Actor = { x: number; y: number; dir: 1 | -1; frame: number; sitting: boolean };
type Point = { x: number; y: number };
type RemoteWalk = { path: Point[]; sit: Point | null };

const WALK_SPEED = 0.055;
const BUBBLE_MS = 6000;

// Moves an actor along a route by up to `distance` pixels. True once it arrives.
function advance(actor: Actor, route: Point[], distance: number) {
  let left = distance;
  while (route.length && left > 0) {
    const target = route[0];
    const dx = target.x - actor.x;
    const dy = target.y - actor.y;
    const gap = Math.hypot(dx, dy);
    if (dx) actor.dir = dx < 0 ? -1 : 1;
    if (gap <= left) {
      actor.x = target.x;
      actor.y = target.y;
      route.shift();
      left -= gap;
    } else {
      actor.x += (dx / gap) * left;
      actor.y += (dy / gap) * left;
      left = 0;
    }
  }
  return route.length === 0;
}

export function OfficeStage({
  me,
  staff,
  calm,
  onHotspot,
  onFrank,
  onMove,
  onSofaFull,
}: {
  me: StaffPublic;
  staff: StaffPublic[];
  calm: boolean;
  onHotspot: (id: (typeof HOTSPOTS)[number]) => void;
  onFrank: (line: string) => void;
  onMove: (x: number, y: number, sitting?: boolean) => void;
  onSofaFull?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frankButton = useRef<HTMLButtonElement>(null);
  const plates = useRef<Record<string, HTMLDivElement | null>>({});
  const bubbles = useRef<Record<string, HTMLDivElement | null>>({});
  const seenEmotes = useRef<Record<string, number>>({});
  const actors = useRef<Record<string, Actor>>({});
  const path = useRef<Point[]>([]);
  const remote = useRef<Record<string, RemoteWalk>>({});
  const redraw = useRef<() => void>(() => undefined);
  const pendingSit = useRef<{ x: number; y: number } | null>(null);
  const moving = useRef(false);
  const frank = useRef<FrankState>(createFrank());
  const lineIndex = useRef(0);
  const propsRef = useRef({ me, staff, calm, onMove, onSofaFull });
  propsRef.current = { me, staff, calm, onMove, onSofaFull };
  const [scale, setScale] = useState(2);
  const scaleRef = useRef(2);

  useEffect(() => {
    for (const person of staff) {
      const seat = SEATS[person.slug];
      const target = { x: person.x || seat.x, y: person.y || seat.y };
      const current = actors.current[person.slug];
      // My own character is driven by my clicks, never by what comes back.
      if (person.slug === me.slug) {
        if (!current) actors.current[person.slug] = { ...target, dir: 1, frame: 0, sitting: false };
        continue;
      }
      if (!current || !person.online) {
        actors.current[person.slug] = { ...target, dir: current?.dir ?? 1, frame: current?.frame ?? 0, sitting: person.online && person.sitting };
        delete remote.current[person.slug];
        continue;
      }
      // Someone else moved: walk them to where they now are, instead of jumping.
      const heading = remote.current[person.slug];
      const end = heading ? heading.sit ?? heading.path[heading.path.length - 1] ?? current : current;
      const sittingAtEnd = heading ? Boolean(heading.sit) : current.sitting;
      if (Math.hypot(end.x - target.x, end.y - target.y) < 4 && sittingAtEnd === person.sitting) continue;
      current.sitting = false;
      const route = findPath(current, person.sitting ? { x: target.x, y: 224 } : target);
      if (!route.length) {
        current.x = target.x;
        current.y = target.y;
        current.sitting = person.sitting;
        delete remote.current[person.slug];
        continue;
      }
      remote.current[person.slug] = { path: route, sit: person.sitting ? target : null };
    }
    redraw.current();
  }, [staff, me.slug]);

  // Emotes pop up over a character for a few seconds. Old ones seen on joining are skipped.
  // Hide timers are left to run across re-renders, since presence updates often.
  useEffect(() => {
    for (const person of staff) {
      const emote = person.emote;
      const bubble = bubbles.current[person.slug];
      if (!emote || !bubble || seenEmotes.current[person.slug] === emote.at) continue;
      seenEmotes.current[person.slug] = emote.at;
      if (Math.abs(Date.now() - emote.at) > 60_000) continue;
      const icon = EMOTES.find((item) => item.id === emote.id);
      if (!icon) continue;
      bubble.textContent = icon.icon;
      bubble.setAttribute("aria-label", `${person.characterName}: ${icon.label}`);
      bubble.dataset.show = "true";
      const at = emote.at;
      window.setTimeout(() => {
        if (seenEmotes.current[person.slug] === at) delete bubble.dataset.show;
      }, BUBBLE_MS);
    }
    redraw.current();
  }, [staff]);

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const width = Math.max(wrap.clientWidth - 12, 320);
      const height = Math.max(wrap.clientHeight - 12, 280);
      const fit = Math.min(width / ROOM_W, height / ROOM_H);
      const next = Math.max(1, Math.min(4, Math.round(fit * 100) / 100));
      scaleRef.current = next;
      setScale((current) => (Math.abs(current - next) < 0.01 ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (wrapRef.current) observer.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(40, now - last);
      last = now;
      const reduced = propsRef.current.calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Calmer motion skips the walk and places people straight at the end.
      const step = reduced ? Infinity : dt * WALK_SPEED;
      const mine = actors.current[propsRef.current.me.slug];
      if (mine && path.current.length) {
        moving.current = true;
        mine.frame = Math.floor(now / 160);
        if (advance(mine, path.current, step)) {
          moving.current = false;
          const seat = pendingSit.current;
          pendingSit.current = null;
          if (seat) {
            mine.x = seat.x;
            mine.y = seat.y;
          }
          mine.sitting = Boolean(seat);
          propsRef.current.onMove(mine.x, mine.y, mine.sitting);
        }
      }
      for (const [slug, walk] of Object.entries(remote.current)) {
        const actor = actors.current[slug];
        if (!actor) continue;
        actor.frame = Math.floor(now / 160);
        if (advance(actor, walk.path, step)) {
          if (walk.sit) {
            actor.x = walk.sit.x;
            actor.y = walk.sit.y;
          }
          actor.sitting = Boolean(walk.sit);
          delete remote.current[slug];
        }
      }
      if (!reduced) stepFrank(frank.current, dt, false);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, ROOM_W, ROOM_H);
      ctx.drawImage(staticRoom(), 0, 0);
      const offline: Partial<Record<StaffSlug, boolean>> = {};
      for (const person of propsRef.current.staff) offline[person.slug] = !person.online;
      drawAnimated(ctx, now, { calm: reduced, offline });

      const drawables: { y: number; draw: () => void }[] = [];
      for (const person of propsRef.current.staff) {
        const actor = actors.current[person.slug] ?? { x: SEATS[person.slug].x, y: SEATS[person.slug].y, dir: 1 as const, frame: 0, sitting: person.sitting };
        const pose = actor.sitting || !person.online ? "sit" : "stand";
        const bob = pose === "stand" && !reduced && person.online ? actor.frame % 2 : 0;
        drawables.push({
          y: actor.y,
          draw: () => {
            ctx.save();
            if (actor.dir < 0) {
              ctx.translate(actor.x + 16, 0);
              ctx.scale(-1, 1);
              drawCharacter(ctx, person.appearance, -16, actor.y - 48 + bob, bob, pose, 2);
            } else {
              drawCharacter(ctx, person.appearance, actor.x - 16, actor.y - 48 + bob, bob, pose, 2);
            }
            ctx.restore();
            if (!person.online) {
              ctx.fillStyle = "#f3e6cf";
              ctx.fillRect(actor.x + 10, actor.y - 52, 3, 3);
            } else if (person.status === "break") {
              ctx.fillStyle = "#ff808b";
              ctx.fillRect(actor.x + 8, actor.y - 54, 6, 5);
            } else if (person.status === "meeting") {
              ctx.fillStyle = "#f7efe2";
              ctx.fillRect(actor.x + 8, actor.y - 54, 8, 5);
            } else if (person.status === "away") {
              ctx.fillStyle = "#d7e2f4";
              ctx.fillRect(actor.x + 10, actor.y - 54, 4, 4);
            } else if (person.status === "focus") {
              ctx.fillStyle = "#9b7fd1";
              ctx.fillRect(actor.x + 8, actor.y - 54, 7, 4);
            } else if (person.status === "available") {
              ctx.fillStyle = "#7dba6a";
              ctx.fillRect(actor.x + 12, actor.y - 52, 3, 3);
            }
            const plate = plates.current[person.slug];
            if (plate) {
              plate.style.left = `${(actor.x - 28) * scaleRef.current}px`;
              plate.style.top = `${(actor.y + 2) * scaleRef.current}px`;
            }
            const bubble = bubbles.current[person.slug];
            if (bubble) {
              bubble.style.left = `${actor.x * scaleRef.current}px`;
              bubble.style.top = `${(actor.y - 50) * scaleRef.current}px`;
            }
          },
        });
      }
      drawables.push({ y: frank.current.y + FRANK_H, draw: () => drawFrank(ctx, frank.current) });
      drawables.sort((a, b) => a.y - b.y);
      for (const item of drawables) item.draw();

      if (frankButton.current) {
        frankButton.current.style.left = `${frank.current.x * scaleRef.current}px`;
        frankButton.current.style.top = `${frank.current.y * scaleRef.current}px`;
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    // With calmer motion the loop stops after each draw, so changes ask for one more frame.
    redraw.current = () => {
      if (alive && !raf) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      redraw.current = () => undefined;
      cancelAnimationFrame(raf);
    };
  }, [scale, calm]);

  function standUp(actor: Actor) {
    pendingSit.current = null;
    if (!actor.sitting) return;
    actor.sitting = false;
    propsRef.current.onMove(actor.x, actor.y, false);
    redraw.current();
  }

  // Share where I'm heading as soon as I set off, so everyone else sees me walk
  // there at the same time rather than appear once I've arrived.
  function startWalk(route: Point[], sit: Point | null = null) {
    path.current = route;
    const end = sit ?? route[route.length - 1];
    if (end) propsRef.current.onMove(end.x, end.y, Boolean(sit));
    redraw.current();
  }

  function sitStraightAway(actor: Actor, spot: Point) {
    actor.x = spot.x;
    actor.y = spot.y;
    actor.sitting = true;
    pendingSit.current = null;
    propsRef.current.onMove(actor.x, actor.y, true);
    redraw.current();
  }

  function sitDown() {
    const slug = propsRef.current.me.slug;
    let actor = actors.current[slug];
    if (!actor) {
      actor = { x: SEATS[slug].x, y: SEATS[slug].y, dir: 1, frame: 0, sitting: false };
      actors.current[slug] = actor;
    }
    const spot = SOFA_SPOTS.find(
      (item) => !Object.entries(actors.current).some(([slug, other]) => slug !== propsRef.current.me.slug && other.sitting && Math.abs(other.x - item.x) < 16),
    );
    if (!spot) {
      propsRef.current.onSofaFull?.();
      return;
    }
    pendingSit.current = spot;
    actor.sitting = false;
    const reduced = propsRef.current.calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const route = reduced ? [] : findPath(actor, { x: spot.x, y: 224 });
    if (!route.length) {
      sitStraightAway(actor, spot);
      return;
    }
    startWalk(route, spot);
  }

  function walkTo(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    const canvas = canvasRef.current;
    const actor = actors.current[me.slug];
    if (!canvas || !actor) return;
    const box = canvas.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * ROOM_W;
    const y = ((event.clientY - box.top) / box.height) * ROOM_H;
    if (y < 120) return;
    standUp(actor);
    startWalk(findPath(actor, { x, y }));
  }

  function nudge(dx: number, dy: number) {
    const actor = actors.current[me.slug];
    if (!actor) return;
    standUp(actor);
    const next = { x: actor.x + dx, y: actor.y + dy };
    const route = findPath(actor, next);
    if (route.length) startWalk(route);
  }

  return (
    <div className="stage-scroll" ref={wrapRef}>
      <div
        className="stage"
        ref={stageRef}
        style={{ width: ROOM_W * scale, height: ROOM_H * scale }}
        onClick={walkTo}
        onKeyDown={(event) => {
          if (event.target !== stageRef.current) return;
          const step = 16;
          if (event.key === "ArrowLeft") nudge(-step, 0);
          else if (event.key === "ArrowRight") nudge(step, 0);
          else if (event.key === "ArrowUp") nudge(0, -step);
          else if (event.key === "ArrowDown") nudge(0, step);
          else return;
          event.preventDefault();
        }}
        tabIndex={0}
        role="application"
        aria-label="MM Digital office. Arrow keys walk when this floor is focused. Tab reaches desks, the noticeboard, and Frank."
      >
        <canvas ref={canvasRef} width={ROOM_W} height={ROOM_H} style={{ width: ROOM_W * scale, height: ROOM_H * scale }} />
        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className="hotspot"
            style={{ left: spot.x * scale, top: spot.y * scale, width: spot.w * scale, height: spot.h * scale }}
            onClick={(event) => {
              event.stopPropagation();
              if (spot.action === "lounge") {
                sitDown();
                return;
              }
              onHotspot(spot);
            }}
          >
            {spot.label}
          </button>
        ))}
        <button
          ref={frankButton}
          type="button"
          className="hotspot frank-spot"
          style={{ width: FRANK_W * scale, height: FRANK_H * scale }}
          onClick={() => {
            const line = FRANK_LINES[lineIndex.current % FRANK_LINES.length];
            lineIndex.current += 1;
            frank.current.mode = frank.current.mode === "sleep" ? "sit" : "idle";
            frank.current.until = 1600;
            onFrank(line);
          }}
        >
          Frank the office cat
        </button>
        {staff.map((person) => (
          <div
            key={person.slug}
            ref={(node) => {
              plates.current[person.slug] = node;
            }}
            className="nameplate"
            aria-hidden="true"
          >
            <strong>{person.characterName}</strong>
            <span>{person.online ? statusLabel(person.status) : "Offline"}</span>
          </div>
        ))}
        {staff.map((person) => (
          <div
            key={`bubble-${person.slug}`}
            ref={(node) => {
              bubbles.current[person.slug] = node;
            }}
            className="emote-bubble"
            role="status"
          />
        ))}
      </div>
    </div>
  );
}
