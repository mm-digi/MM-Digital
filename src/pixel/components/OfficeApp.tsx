"use client";

import { useEffect, useRef, useState } from "react";
import { ClientLights } from "@/pixel/components/ClientLights";
import { Creator } from "@/pixel/components/Creator";
import { OfficeStage } from "@/pixel/components/OfficeStage";
import {
  CalendarPanel,
  DayPanel,
  DeskPanel,
  NotionPanel,
  ProfilePanel,
  ProjectPanel,
  QuestPanel,
  TeamPanel,
} from "@/pixel/components/panels";
import { blip, setAmbient } from "@/pixel/components/sound";
import { STATUSES } from "@/pixel/game/options";
import type { ActionBody, ActionResult, PanelId, Snapshot, StaffSlug } from "@/pixel/types";

export function OfficeApp({ snapshot, presentation }: { snapshot: Snapshot; presentation: "office" | "plain" }) {
  const [snap, setSnap] = useState(snapshot);
  const [panel, setPanel] = useState<PanelId | null>(snapshot.me.creatorDone ? "day" : "creator");
  const [deskSlug, setDeskSlug] = useState<StaffSlug>(snapshot.me.slug);
  const [questFilter, setQuestFilter] = useState<"mine" | "all" | "meetings" | "done">("mine");
  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileOffice, setMobileOffice] = useState(false);
  const [frankLine, setFrankLine] = useState<string | null>(null);
  const position = useRef<{ x: number; y: number; sitting?: boolean } | null>(null);
  const soundOn = snap.me.sound;

  useEffect(() => {
    setAmbient(soundOn);
    return () => setAmbient(false);
  }, [soundOn]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetch("/api/pixel/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "presence", x: position.current?.x, y: position.current?.y, sitting: position.current?.sitting }),
      })
        .then((response) => response.json())
        .then((data: ActionResult) => {
          if (!data.staff) return;
          setSnap((current) => ({
            ...current,
            staff: current.staff.map((person) => {
              const next = data.staff?.find((item) => item.slug === person.slug);
              if (!next) return person;
              if (person.slug === current.me.slug && position.current) {
                return { ...person, online: true, status: next.status, appearance: next.appearance, characterName: next.characterName };
              }
              return { ...person, ...next, notes: person.notes };
            }),
          }));
        })
        .catch(() => undefined);
    }, 12000);
    const refresh = window.setInterval(() => {
      void fetch("/api/pixel/")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: Snapshot | null) => {
          if (data?.me) setSnap(data);
        })
        .catch(() => undefined);
    }, 180000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "Escape") setPanel(null);
      if (event.key.toLowerCase() === "d") setPanel("day");
      if (event.key.toLowerCase() === "q") setPanel("quests");
      if (event.key.toLowerCase() === "t") setPanel("team");
      if (event.key.toLowerCase() === "c") setPanel("calendar");
      if (event.key.toLowerCase() === "p") setPanel("projects");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      if (body.type === "preferences" && body.plainMode) window.location.href = "/pixel/plain/";
      if (body.type === "preferences" && body.plainMode === false && presentation === "plain") window.location.href = "/pixel/";
      return data;
    } catch {
      showToast("The office could not save that.", false);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/logout/", { method: "POST" });
    window.location.href = "/login/";
  }

  const close = presentation === "plain" ? undefined : () => setPanel(null);
  const panels = (
    <>
      {panel === "day" || presentation === "plain" ? <DayPanel snap={snap} onClose={close} openPanel={setPanel} /> : null}
      {panel === "quests" || presentation === "plain" ? (
        <QuestPanel snap={snap} busy={busy} act={act} onClose={close} filter={questFilter} setFilter={setQuestFilter} />
      ) : null}
      {panel === "team" || presentation === "plain" ? <TeamPanel snap={snap} busy={busy} act={act} onClose={close} /> : null}
      {panel === "calendar" || presentation === "plain" ? <CalendarPanel snap={snap} onClose={close} /> : null}
      {panel === "projects" || presentation === "plain" ? <ProjectPanel snap={snap} onClose={close} /> : null}
      {panel === "desk" || presentation === "plain" ? (
        <DeskPanel snap={snap} busy={busy} act={act} slug={deskSlug} onClose={close} openPanel={setPanel} />
      ) : null}
      {panel === "profile" ? (
        <ProfilePanel snap={snap} busy={busy} act={act} onClose={close} onEdit={() => setPanel("creator")} onLogout={() => void logout()} />
      ) : null}
      {panel === "notion" && snap.me.role === "admin" ? <NotionPanel snap={snap} busy={busy} act={act} onClose={close} /> : null}
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
        <p className="mode-pill">{snap.notion.mode === "live" ? "Notion live" : snap.notion.mode === "stale" ? "Notion delayed" : "Local demo"}</p>
        <div className="row-actions">
          {snap.me.role === "admin" ? <button type="button" className="pxbtn alt tiny" onClick={() => setPanel("notion")}>Notion</button> : null}
          <button type="button" className="pxbtn alt tiny" onClick={() => void act({ type: "notionRefresh" })} disabled={busy}>Refresh</button>
          <a className="texty" href="/team-access/">Dashboards</a>
          <a className="texty" href="/pixel/plain/">Plain list</a>
        </div>
      </header>
      <div className="main">
        {presentation === "office" ? <ClientLights snap={snap} busy={busy} act={act} /> : null}
        <OfficeStage
          me={snap.me}
          staff={snap.staff}
          calm={snap.me.calm}
          onHotspot={(spot) => {
            if (spot.action === "desk" && spot.slug) {
              setDeskSlug(spot.slug);
              setPanel("desk");
            } else if (spot.action === "team") setPanel("team");
            else if (spot.action === "calendar") setPanel("calendar");
            else if (spot.action === "projects") setPanel("projects");
            else if (spot.action === "meetings") {
              setQuestFilter("meetings");
              setPanel("quests");
            } else if (spot.action === "coffee") {
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
          onMove={(x, y, sitting) => {
            position.current = { x, y, sitting };
            const send = () => fetch("/api/pixel/", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ type: "presence", x, y, sitting: Boolean(sitting) }),
            }).then((response) => {
              if (!response.ok) throw new Error("busy");
            });
            void send().catch(() => {
              window.setTimeout(() => {
                void send().catch(() => undefined);
              }, 900);
            });
          }}
        />
        <aside className="dock">{panel === "creator" ? null : panels}</aside>
      </div>
      {frankLine ? <div className="speech" role="status">{frankLine}</div> : null}
      <nav className="hotbar" aria-label="Office">
        <BarButton current={panel} id="day" label="My day" onPick={setPanel} />
        <BarButton current={panel} id="quests" label="Quests" onPick={setPanel} />
        <BarButton current={panel} id="team" label="Team" onPick={setPanel} />
        <BarButton current={panel} id="calendar" label="Calendar" onPick={setPanel} />
        <BarButton current={panel} id="projects" label="Projects" onPick={setPanel} />
        <button type="button" className={panel === "desk" ? "pxbtn tiny" : "pxbtn alt tiny"} onClick={() => { setDeskSlug(snap.me.slug); setPanel("desk"); }}>My desk</button>
        <button type="button" className={panel === "profile" ? "pxbtn tiny" : "pxbtn alt tiny"} onClick={() => setPanel("profile")}>Me</button>
      </nav>
      <nav className="mobile-nav" aria-label="Mobile">
        <button type="button" onClick={() => { setMobileOffice(false); setPanel("day"); }}>Day</button>
        <button type="button" onClick={() => { setMobileOffice(false); setPanel("quests"); }}>Quests</button>
        <button type="button" onClick={() => { setMobileOffice(false); setPanel("calendar"); }}>Dates</button>
        <button type="button" onClick={() => { setMobileOffice(false); setPanel("projects"); }}>Projects</button>
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

function BarButton({ current, id, label, onPick }: { current: PanelId | null; id: PanelId; label: string; onPick: (id: PanelId) => void }) {
  return (
    <button type="button" className={current === id ? "pxbtn tiny" : "pxbtn alt tiny"} aria-pressed={current === id} onClick={() => onPick(id)}>
      {label}
    </button>
  );
}

function Toast({ toast, celebrate }: { toast: string | null; celebrate: boolean }) {
  if (!toast) return null;
  return <div className={celebrate ? "toast party" : "toast"} role="status">{toast}</div>;
}
