"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { ROOM_H, ROOM_W } from "@/pixel/game/layout";
import { EMOTES, STATUSES } from "@/pixel/game/options";
import type { Emote, LiveConfig, Presence, StaffPublic, StaffSlug } from "@/pixel/types";

// Live presence for the office. Each open tab joins one Supabase Realtime
// channel and shares where it is standing, so nothing about who is online or
// where they are goes through the shared office file any more.

function cleanEmote(value: unknown): Emote | null {
  if (!value || typeof value !== "object") return null;
  const emote = value as Partial<Emote>;
  if (!EMOTES.some((item) => item.id === emote.id) || typeof emote.at !== "number") return null;
  return { id: emote.id as Emote["id"], at: emote.at };
}

function clean(value: unknown, fallback: StaffPublic): Presence | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Presence>;
  if (typeof item.x !== "number" || typeof item.y !== "number" || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return null;
  return {
    x: Math.max(0, Math.min(ROOM_W, item.x)),
    y: Math.max(0, Math.min(ROOM_H, item.y)),
    sitting: Boolean(item.sitting),
    status: STATUSES.some((status) => status.id === item.status) ? (item.status as Presence["status"]) : fallback.status,
    appearance: item.appearance && typeof item.appearance === "object" ? item.appearance : fallback.appearance,
    characterName: typeof item.characterName === "string" && item.characterName.trim() ? item.characterName.slice(0, 18) : fallback.characterName,
    emote: cleanEmote(item.emote),
  };
}

export function useLivePresence(live: LiveConfig | null, me: StaffPublic, staff: StaffPublic[]) {
  const [others, setOthers] = useState<Record<string, unknown>>({});
  const [myEmote, setMyEmote] = useState<Emote | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const joined = useRef(false);
  const mine = useRef<Presence>({
    x: me.x,
    y: me.y,
    sitting: false,
    status: me.status,
    appearance: me.appearance,
    characterName: me.characterName,
    emote: null,
  });
  const slug = me.slug;
  const url = live?.url;
  const key = live?.key;
  const name = live?.channel;

  useEffect(() => {
    if (!url || !key || !name) return;
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const room = client.channel(name, { config: { presence: { key: slug } } });
    room
      .on("presence", { event: "sync" }, () => {
        const state = room.presenceState();
        const next: Record<string, unknown> = {};
        for (const [person, entries] of Object.entries(state)) {
          if (person === slug) continue;
          // Several tabs for one person: the newest one wins.
          const latest = entries[entries.length - 1];
          if (latest) next[person] = latest;
        }
        setOthers(next);
      })
      .subscribe((status) => {
        joined.current = status === "SUBSCRIBED";
        if (joined.current) void room.track(mine.current).catch(() => undefined);
      });
    channel.current = room;
    return () => {
      joined.current = false;
      channel.current = null;
      void client.removeChannel(room);
    };
  }, [url, key, name, slug]);

  const share = useCallback((patch: Partial<Presence>) => {
    mine.current = { ...mine.current, ...patch };
    if (joined.current) void channel.current?.track(mine.current).catch(() => undefined);
  }, []);

  const emote = useCallback(
    (id: Emote["id"]) => {
      const next = { id, at: Date.now() };
      setMyEmote(next);
      share({ emote: next });
    },
    [share],
  );

  useEffect(() => {
    share({ status: me.status, appearance: me.appearance, characterName: me.characterName });
  }, [share, me.status, me.appearance, me.characterName]);

  const merged = useMemo(
    () =>
      staff.map((person) => {
        if (person.slug === slug) return { ...person, online: true, emote: myEmote };
        const seen = clean(others[person.slug as StaffSlug], person);
        return seen ? { ...person, ...seen, online: true } : { ...person, online: false };
      }),
    [staff, others, slug, myEmote],
  );

  return { staff: merged, share, emote, connected: Boolean(live) };
}
