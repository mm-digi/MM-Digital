"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ClientLights } from "@/pixel/components/ClientLights";
import { Creator } from "@/pixel/components/Creator";
import { OfficeStage } from "@/pixel/components/OfficeStage";
import {
  CalendarPanel,
  ClientPanel,
  DayPanel,
  DeskPanel,
  FocusClock,
  isNewNote,
  NotionPanel,
  ProfilePanel,
  ProjectPanel,
  QuestPanel,
  StandupPanel,
  TeamPanel,
  WrapupPanel,
} from "@/pixel/components/panels";
import { useLivePresence } from "@/pixel/components/presence";
import { blip, setAmbient } from "@/pixel/components/sound";
import { EMOTES, STATUSES } from "@/pixel/game/options";
import type { ActionBody, ActionResult, EmoteId, PanelId, Snapshot, StaffSlug } from "@/pixel/types";

const SHORTCUTS: Record<string, PanelId> = { d: "day", q: "quests", t: "team", c: "calendar", p: "projects", s: "standup", w: "wrapup" };

// On Friday afternoons the wrap-up opens by itself, once a week per person.
const WRAPUP_FROM_HOUR = 14;
const wrapupKey = (slug: string) => `pixel-wrapup-seen:${slug}`;

// When I last read the noticeboard. Kept in this browser only, so "New" badges
// are a per-person convenience and never touch the shared office file.
const notesKey = (slug: string) => `pixel-notes-seen:${slug}`;
const NOTES_EVENT = "pixel-notes-seen";

function readNotesSeen(slug: string) {
  try {
    return window.localStorage.getItem(notesKey(slug));
  } catch {
    return null;
  }
}

function writeNotesSeen(slug: string, value: string) {
  try {
    window.localStorage.setItem(notesKey(slug), value);
  } catch {
    // Private windows can refuse storage. The badges just stay off.
  }
  window.dispatchEvent(new Event(NOTES_EVENT));
}

function subscribeNotes(onChange: () => void) {
  window.addEventListener(NOTES_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(NOTES_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function OfficeApp({ snapshot, presentation }: { snapshot: Snapshot; presentation: "office" | "plain" }) {
  const [snap, setSnap] = useState(snapshot);
  const [panel, setPanel] = useState<PanelId | null>(snapshot.me.creatorDone ? "day" : "creator");
  const [deskSlug, setDeskSlug] = useState<StaffSlug>(snapshot.me.slug);
  const [client, setClient] = useState<{ slug: string; name: string } | null>(null);
  const [questFilter, setQuestFilter] = useState<"mine" | "all" | "meetings" | "done">("mine");
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileOffice, setMobileOffice] = useState(false);
  const [frankLine, setFrankLine] = useState<string | null>(null);
  const [teamNewSince, setTeamNewSince] = useState<string | null>(null);
  const asked = useRef(new Set<string>());
  const actRef = useRef<(body: ActionBody) => Promise<ActionResult | void>>(async () => undefined);
  const openRef = useRef<(id: PanelId) => void>(() => undefined);
  const soundOn = snap.me.sound;
  const mySlug = snap.me.slug;
  const live = useLivePresence(snapshot.live, snap.me, snap.staff);
  const view = useMemo(() => ({ ...snap, me: { ...snap.me, online: true }, staff: live.staff }), [snap, live.staff]);
  const notesSeen = useSyncExternalStore(subscribeNotes, () => readNotesSeen(mySlug), () => null);
  const isFriday = snap.today === snap.wrapup.week[4];
  const unreadNotes = snap.announcements.filter((note) => isNewNote(note, snap, notesSeen)).length;

  useEffect(() => {
    setAmbient(soundOn);
    return () => setAmbient(false);
  }, [soundOn]);

  useEffect(() => {
    // First visit: start counting new notes from now, not from the beginning of time.
    if (readNotesSeen(mySlug) === null) writeNotesSeen(mySlug, new Date().toISOString());
  }, [mySlug]);

  useEffect(() => {
    const refresh = window.setInterval(() => {
      void fetch("/api/pixel/")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: Snapshot | null) => {
          if (data?.me) setSnap(data);
        })
        .catch(() => undefined);
    }, 180000);
    return () => window.clearInterval(refresh);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") setPanel(null);
      const target = SHORTCUTS[event.key.toLowerCase()];
      if (target) openRef.current(target);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const weekStart = snap.wrapup.week[0];
  useEffect(() => {
    const now = new Date();
    if (now.getDay() !== 5 || now.getHours() < WRAPUP_FROM_HOUR || !snapshot.me.creatorDone) return;
    try {
      if (window.localStorage.getItem(wrapupKey(mySlug)) === weekStart) return;
      window.localStorage.setItem(wrapupKey(mySlug), weekStart);
    } catch {
      return;
    }
    // A short pause so it slides in after the office has drawn.
    const timer = window.setTimeout(() => setPanel("wrapup"), 800);
    return () => window.clearTimeout(timer);
  }, [mySlug, weekStart, snapshot.me.creatorDone]);

  // The focus timer ends here whichever window is open, and the server checks the time.
  const focusEnds = snap.focus?.endsAt;
  useEffect(() => {
    if (!focusEnds) return;
    const wait = Math.max(0, Date.parse(focusEnds) - Date.now()) + 1000;
    const timer = window.setTimeout(() => void actRef.current({ type: "focusDone" }), wait);
    return () => window.clearTimeout(timer);
  }, [focusEnds]);

  function showToast(message: string, party: boolean) {
    setToast(message);
    setCelebrate(party);
    if (party && soundOn) blip();
    window.setTimeout(() => setToast(null), 3200);
  }

  async function act(body: ActionBody): Promise<ActionResult | void> {
    setBusy(true);
    try {
      const response = await fetch("/api/pixel/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as ActionResult;
      if (data.snapshot) setSnap(data.snapshot);
      if (data.toast) showToast(data.toast, Boolean(data.celebrate));
      else if (!data.ok && data.error) showToast(data.error, false);
      if (body.type === "preferences" && body.plainMode) window.location.assign("/pixel/plain/");
      if (body.type === "preferences" && body.plainMode === false && presentation === "plain") window.location.assign("/pixel/");
      return data;
    } catch {
      showToast("The office could not save that.", false);
    } finally {
      setBusy(false);
    }
  }

  // Achievements only the browser can see happen. Asked for once per visit.
  function earn(id: "wave" | "stand-up") {
    if (snap.me.achievements.includes(id) || asked.current.has(id)) return;
    asked.current.add(id);
    void act({ type: "achievement", id });
  }

  function openPanel(id: PanelId) {
    if (id === "team") {
      setTeamNewSince(notesSeen);
      writeNotesSeen(mySlug, new Date().toISOString());
    }
    if (id === "standup") earn("stand-up");
    setPanel(id);
  }

  function openClient(slug: string, name: string) {
    setClient({ slug, name });
    setPanel("client");
    setMobileOffice(false);
  }

  function sendEmote(id: EmoteId) {
    live.emote(id);
    earn("wave");
  }

  useEffect(() => {
    actRef.current = act;
    openRef.current = openPanel;
  });

  async function logout() {
    await fetch("/api/logout/", { method: "POST" });
    window.location.href = "/login/";
  }

  const close = presentation === "plain" ? undefined : () => setPanel(null);
  const panels = (
    <>
      {panel === "day" || presentation === "plain" ? <DayPanel snap={view} onClose={close} openPanel={openPanel} /> : null}
      {panel === "standup" || presentation === "plain" ? <StandupPanel snap={view} onClose={close} openPanel={openPanel} /> : null}
      {panel === "wrapup" || presentation === "plain" ? <WrapupPanel snap={view} onClose={close} /> : null}
      {panel === "client" && client ? <ClientPanel key={client.slug} slug={client.slug} name={client.name} onClose={() => setPanel(null)} /> : null}
      {panel === "quests" || presentation === "plain" ? (
        <QuestPanel snap={view} busy={busy} act={act} onClose={close} filter={questFilter} setFilter={setQuestFilter} />
      ) : null}
      {panel === "team" || presentation === "plain" ? (
        <TeamPanel snap={view} busy={busy} act={act} onClose={close} newSince={presentation === "plain" ? notesSeen : teamNewSince} />
      ) : null}
      {panel === "calendar" || presentation === "plain" ? <CalendarPanel snap={view} onClose={close} /> : null}
      {panel === "projects" || presentation === "plain" ? <ProjectPanel snap={view} onClose={close} /> : null}
      {panel === "desk" || presentation === "plain" ? (
        <DeskPanel snap={view} busy={busy} act={act} slug={deskSlug} onClose={close} openPanel={openPanel} />
      ) : null}
      {panel === "profile" ? (
        <ProfilePanel snap={view} busy={busy} act={act} onClose={close} onEdit={() => setPanel("creator")} onLogout={() => void logout()} />
      ) : null}
      {panel === "notion" && snap.me.role === "admin" ? <NotionPanel snap={view} busy={busy} act={act} onClose={close} /> : null}
    </>
  );

  if (presentation === "plain") {
    return (
      <main className="plain-app">
        <header className="topbar">
          <div>
            <p className="brand">MM Digital</p>
            <h1>Plain task list</h1>
          </div>
          <div className="row-actions">
            <button type="button" className="pxbtn" onClick={() => void act({ type: "preferences", plainMode: false })}>Enter the office</button>
            <a className="pxbtn alt" href="/team-access/">Dashboards</a>
            <button type="button" className="pxbtn alt" onClick={() => void logout()}>Sign out</button>
          </div>
        </header>
        <p className="fine">Signed in as {snap.me.name}. This view keeps the same tasks without the office scene.</p>
        {panels}
        <Toast toast={toast} celebrate={celebrate} />
      </main>
    );
  }

  return (
    <div className={mobileOffice ? "hq show-office" : "hq"}>
      <a className="skip" href="#today">Skip to today&apos;s tasks</a>
      <header className="topbar">
        <div>
          <p className="brand">MM Pixel HQ</p>
          <p>{snap.me.characterName} · {snap.me.title}</p>
        </div>
        <label className="status-label">
          Status
          <select
            value={snap.me.status}
            onChange={(event) => void act({ type: "status", status: event.target.value as Snapshot["me"]["status"] })}
          >
            {STATUSES.map((status) => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>
        </label>
        {snap.focus ? (
          <button type="button" className="mode-pill focus-pill" onClick={() => { setDeskSlug(snap.me.slug); openPanel("desk"); }}>
            Focusing · <FocusClock endsAt={snap.focus.endsAt} />
          </button>
        ) : null}
        <p className="mode-pill">{snap.notion.mode === "live" ? "Notion live" : snap.notion.mode === "stale" ? "Notion delayed" : "Local demo"}</p>
        <div className="row-actions">
          {snap.me.role === "admin" ? <button type="button" className="pxbtn alt tiny" onClick={() => setPanel("notion")}>Notion</button> : null}
          <button type="button" className="pxbtn alt tiny" onClick={() => void act({ type: "notionRefresh" })} disabled={busy}>Refresh</button>
          <a className="texty" href="/team-access/">Dashboards</a>
          <a className="texty" href="/pixel/plain/">Plain list</a>
        </div>
      </header>
      <div className="main">
        {presentation === "office" ? <ClientLights snap={snap} busy={busy} act={act} onOpen={openClient} /> : null}
        <OfficeStage
          me={view.me}
          staff={view.staff}
          calm={snap.me.calm}
          onHotspot={(spot) => {
            if (spot.action === "desk" && spot.slug) {
              setDeskSlug(spot.slug);
              openPanel("desk");
            } else if (spot.action === "team") openPanel("team");
            else if (spot.action === "calendar") openPanel("calendar");
            else if (spot.action === "projects") openPanel("projects");
            else if (spot.action === "meetings") openPanel("standup");
            else if (spot.action === "coffee") {
              void act({ type: "status", status: "break" });
            }
            setMobileOffice(false);
          }}
          onSofaFull={() => showToast("The sofa is full.", false)}
          onFrank={(line) => {
            setFrankLine(line);
            void act({ type: "frank" });
            window.setTimeout(() => setFrankLine(null), 4200);
          }}
          onMove={(x, y, sitting) => live.share({ x, y, sitting: Boolean(sitting) })}
        />
        <aside className="dock">{panel === "creator" ? null : panels}</aside>
      </div>
      {frankLine ? <div className="speech" role="status">{frankLine}</div> : null}
      <nav className="hotbar" aria-label="Office">
        <BarButton current={panel} id="day" label="My day" shortcut="D" onPick={openPanel} />
        <BarButton current={panel} id="standup" label="Stand-up" shortcut="S" onPick={openPanel} />
        <BarButton current={panel} id="quests" label="Quests" shortcut="Q" onPick={openPanel} />
        <BarButton current={panel} id="team" label="Team" shortcut="T" badge={unreadNotes} onPick={openPanel} />
        <BarButton current={panel} id="calendar" label="Calendar" shortcut="C" onPick={openPanel} />
        <BarButton current={panel} id="projects" label="Projects" shortcut="P" onPick={openPanel} />
        <BarButton current={panel} id="wrapup" label={isFriday ? "Friday wrap-up" : "Wrap-up"} shortcut="W" onPick={openPanel} />
        <button type="button" className={panel === "desk" ? "pxbtn tiny" : "pxbtn alt tiny"} onClick={() => { setDeskSlug(snap.me.slug); openPanel("desk"); }}>My desk</button>
        <button type="button" className={panel === "profile" ? "pxbtn tiny" : "pxbtn alt tiny"} onClick={() => openPanel("profile")}>Me</button>
        <div className="emotes" role="group" aria-label="Emotes">
          {EMOTES.map((emote) => (
            <button key={emote.id} type="button" className="emote-btn" title={emote.label} aria-label={emote.label} onClick={() => sendEmote(emote.id)}>
              {emote.icon}
            </button>
          ))}
        </div>
      </nav>
      <nav className="mobile-nav" aria-label="Mobile">
        <button type="button" onClick={() => { setMobileOffice(false); openPanel("day"); }}>Day</button>
        <button type="button" onClick={() => { setMobileOffice(false); openPanel("standup"); }}>Stand-up</button>
        <button type="button" onClick={() => { setMobileOffice(false); openPanel("quests"); }}>Quests</button>
        <button type="button" onClick={() => { setMobileOffice(false); openPanel("calendar"); }}>Dates</button>
        <button type="button" onClick={() => setMobileOffice(true)}>Office</button>
      </nav>
      {panel === "creator" ? (
        <Creator
          appearance={snap.me.appearance}
          name={snap.me.characterName}
          level={snap.me.level}
          busy={busy}
          onSave={(characterName, appearance) => {
            void act({ type: "avatar", characterName, appearance }).then(() => setPanel("day"));
          }}
        />
      ) : null}
      <Toast toast={toast} celebrate={celebrate} />
    </div>
  );
}

function BarButton({
  current,
  id,
  label,
  shortcut,
  badge,
  onPick,
}: {
  current: PanelId | null;
  id: PanelId;
  label: string;
  shortcut?: string;
  badge?: number;
  onPick: (id: PanelId) => void;
}) {
  return (
    <button
      type="button"
      className={current === id ? "pxbtn tiny" : "pxbtn alt tiny"}
      aria-pressed={current === id}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (press ${shortcut})` : label}
      onClick={() => onPick(id)}
    >
      {label}
      {shortcut ? <kbd aria-hidden="true">{shortcut}</kbd> : null}
      {badge ? <span className="badge" aria-label={`${badge} new`}>{badge}</span> : null}
    </button>
  );
}

function Toast({ toast, celebrate }: { toast: string | null; celebrate: boolean }) {
  if (!toast) return null;
  return <div className={celebrate ? "toast party" : "toast"} role="status">{toast}</div>;
}
