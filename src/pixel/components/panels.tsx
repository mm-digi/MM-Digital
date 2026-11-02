"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import type { Insight } from "@/lib/metrics/insights";
import { Sprite } from "@/pixel/components/Sprite";
import { Window } from "@/pixel/components/Window";
import { prettyDate, shiftKey, weekKeys } from "@/pixel/lib/format";
import { ACHIEVEMENTS } from "@/pixel/lib/xp";
import { STATUSES, statusLabel } from "@/pixel/game/options";
import type { ActionBody, ActionResult, PanelId, Snapshot, StaffSlug, TaskItem } from "@/pixel/types";

type Act = (body: ActionBody) => Promise<ActionResult | void>;

function byTime(tasks: TaskItem[]) {
  return [...tasks].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.title.localeCompare(b.title));
}

// Soonest first: by date, then time of day, then name. Undated tasks go last.
function byDue(tasks: TaskItem[]) {
  return [...tasks].sort(
    (a, b) => (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "99:99").localeCompare(b.time || "99:99") || a.title.localeCompare(b.title),
  );
}

function dueGroups(tasks: TaskItem[], today: string) {
  const week = new Set(weekKeys(today));
  const groups: { label: string; tasks: TaskItem[] }[] = [
    { label: "Overdue", tasks: [] },
    { label: "Today", tasks: [] },
    { label: "This week", tasks: [] },
    { label: "Later", tasks: [] },
    { label: "No date", tasks: [] },
  ];
  for (const task of byDue(tasks)) {
    const index = !task.date ? 4 : task.date < today ? 0 : task.date === today ? 1 : week.has(task.date) ? 2 : 3;
    groups[index].tasks.push(task);
  }
  return groups.filter((group) => group.tasks.length);
}

const URL_PATTERN = /https?:\/\/[^\s)]+/g;

// "https://www.example.com/page/" becomes "example.com/page".
function shortUrl(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    const text = parsed.hostname.replace(/^www\./, "") + path;
    return text.length > 40 ? `${text.slice(0, 38)}…` : text;
  } catch {
    return url;
  }
}

// A task name with any web addresses in it shortened into clickable links.
export function TaskTitle({ title }: { title: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of title.matchAll(URL_PATTERN)) {
    const url = match[0].replace(/[.,;:!?]+$/, "");
    const start = match.index ?? 0;
    parts.push(title.slice(last, start));
    parts.push(<a key={start} href={url} target="_blank" rel="noreferrer">{shortUrl(url)}</a>);
    last = start + url.length;
  }
  if (!parts.length) return <>{title}</>;
  parts.push(title.slice(last));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}

export function DayPanel({ snap, onClose, openPanel }: { snap: Snapshot; onClose?: () => void; openPanel: (id: PanelId) => void }) {
  const mine = byTime(snap.tasks.filter((task) => task.assignee === snap.me.slug && task.today && task.status !== "done"));
  const overdue = byDue(snap.tasks.filter((task) => task.assignee === snap.me.slug && task.overdue));
  const upcoming = byDue(snap.tasks.filter((task) => task.assignee === snap.me.slug && task.date > snap.today && task.status !== "done")).slice(0, 5);
  return (
    <Window id="today" title={`${snap.me.name.toUpperCase()}'S DAY`} onClose={onClose}>
      {snap.notion.mode === "demo" ? <p className="banner">Demo tasks. Not from Notion.</p> : null}
      {snap.notion.message ? <p className="banner warn">{snap.notion.message}</p> : null}
      {mine.length === 0 ? <p className="empty">Nothing dated for today. The office plant still believes in you.</p> : null}
      <ol className="day-list">
        {mine.map((task) => (
          <li key={task.id}>
            <time>{task.time}</time>
            <div>
              <strong><TaskTitle title={task.title} /></strong>
              <span>{task.project}{task.kind === "meeting" ? " · Meeting" : ""}</span>
            </div>
          </li>
        ))}
      </ol>
      {overdue.length ? (
        <div className="block">
          <h3>Still open</h3>
          <ul className="plain-list">
            {overdue.map((task) => (
              <li key={task.id}><strong><TaskTitle title={task.title} /></strong> <span>{task.dueLabel}</span></li>
            ))}
          </ul>
        </div>
      ) : null}
      {upcoming.length ? (
        <details className="block">
          <summary>Coming up</summary>
          <ul className="plain-list">
            {upcoming.map((task) => (
              <li key={task.id}><strong><TaskTitle title={task.title} /></strong> <span>{task.dueLabel}</span></li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="row-actions">
        <button type="button" className="pxbtn" onClick={() => openPanel("quests")}>Open the quest journal</button>
        <button type="button" className="pxbtn alt" onClick={() => openPanel("standup")}>Stand-up</button>
      </div>
    </Window>
  );
}

export function QuestPanel({
  snap,
  busy,
  act,
  onClose,
  filter,
  setFilter,
}: {
  snap: Snapshot;
  busy: boolean;
  act: Act;
  onClose?: () => void;
  filter: "mine" | "all" | "meetings" | "done";
  setFilter: (value: "mine" | "all" | "meetings" | "done") => void;
}) {
  const tasks = snap.tasks.filter((task) => {
    if (filter === "done") return task.status === "done";
    if (task.status === "done") return false;
    if (filter === "mine") return task.assignee === snap.me.slug;
    if (filter === "meetings") return task.kind === "meeting";
    return true;
  });
  // Finished quests read best newest first; open ones are grouped by when they're due.
  const groups =
    filter === "done"
      ? [{ label: "", tasks: [...tasks].sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")) }]
      : dueGroups(tasks, snap.today);

  function quest(task: TaskItem) {
    const mine = task.assignee === snap.me.slug || task.assignee === null;
    const done = task.status === "done";
    const tags = [
      task.priority === "urgent" ? ["Urgent", "urgent"] : task.priority === "high" ? ["High priority", "high"] : null,
      task.status === "doing" && !done ? ["In progress", "doing"] : null,
      task.kind === "meeting" ? ["Meeting", "meeting"] : null,
      snap.me.gamification && task.xp ? [`${task.xp} XP`, "xp"] : null,
      task.localPreview ? ["Local preview", "preview"] : null,
    ].filter((tag): tag is string[] => Boolean(tag));
    return (
      <li key={task.id} className={done ? "quest done" : "quest"}>
        <i className={`seal ${task.priority}`} title={`${task.priority} priority`} aria-hidden="true" />
        <div>
          <strong><TaskTitle title={task.title} /></strong>
          {task.detail ? <p>{task.detail}</p> : null}
          <p className="meta">{[task.project !== "General" ? task.project : "", task.assigneeName, task.dueLabel].filter(Boolean).join(" · ")}</p>
          {tags.length ? (
            <p className="tags">
              {tags.map(([label, kind]) => <span key={kind} className={`tag tag-${kind}`}>{label}</span>)}
            </p>
          ) : null}
          {task.notionUrl ? <a href={task.notionUrl} target="_blank" rel="noreferrer">Open in Notion</a> : null}
        </div>
        {mine && !done && (task.source === "demo" || task.source === "notion") ? (
          <button type="button" className="pxbtn tiny" disabled={busy} onClick={() => act({ type: "complete", taskId: task.id })}>
            Mark done
          </button>
        ) : null}
        {done ? <span className="done-mark">Done</span> : null}
      </li>
    );
  }

  return (
    <Window title="Quest journal" onClose={onClose}>
      <div className="filters" role="tablist" aria-label="Quest filter">
        {(["mine", "all", "meetings", "done"] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? "chip on" : "chip"} onClick={() => setFilter(value)} aria-pressed={filter === value}>
            {value === "mine" ? "Mine" : value === "all" ? "Whole team" : value === "meetings" ? "Meetings" : "Done"}
          </button>
        ))}
      </div>
      {tasks.length === 0 ? <p className="empty">{filter === "done" ? "Nothing finished yet." : "No quests in this view."}</p> : null}
      {groups.map((group) => (
        <section key={group.label || "done"} className="quest-group">
          {group.label ? <h3 className={group.label === "Overdue" ? "warn" : undefined}>{group.label} <span>({group.tasks.length})</span></h3> : null}
          <ul className="quests">{group.tasks.map(quest)}</ul>
        </section>
      ))}
    </Window>
  );
}

export function TeamPanel({
  snap,
  busy,
  act,
  onClose,
  newSince,
}: {
  snap: Snapshot;
  busy: boolean;
  act: Act;
  onClose?: () => void;
  newSince?: string | null;
}) {
  const [body, setBody] = useState("");
  const today = snap.tasks.filter((task) => task.today && task.status !== "done");
  const week = new Set(weekKeys(snap.today));
  const thisWeek = snap.tasks.filter((task) => week.has(task.date) && task.status !== "done");
  const urgent = snap.tasks.filter((task) => (task.priority === "urgent" || task.priority === "high") && task.status !== "done");
  const done = snap.tasks.filter((task) => task.status === "done");
  const meetings = snap.tasks.filter((task) => task.kind === "meeting" && task.date >= snap.today && task.status !== "done");
  return (
    <Window title="Team noticeboard" onClose={onClose}>
      <div className="portraits">
        {snap.staff.map((person) => (
          <figure key={person.slug}>
            <Sprite appearance={person.appearance} scale={3} animate={person.online && !snap.me.calm} />
            <figcaption>
              <strong>{person.characterName}</strong>
              <span>{person.online ? statusLabel(person.status) : "Offline"}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="workload">
        {snap.staff.map((person) => {
          const open = snap.tasks.filter((task) => task.assignee === person.slug && task.status !== "done").length;
          const filled = Math.min(8, open);
          return (
            <div key={person.slug} className="load">
              <span>{person.name}</span>
              <span className="blocks" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} className={index < filled ? "on" : ""} style={index < filled ? { background: person.accent } : undefined} />)}</span>
              <span>{open} open</span>
            </div>
          );
        })}
      </div>
      <div className="split">
        <section>
          <h3>Due today</h3>
          <TaskList tasks={today} />
        </section>
        <section>
          <h3>Due this week</h3>
          <TaskList tasks={thisWeek.slice(0, 8)} />
        </section>
        <section>
          <h3>Urgent and high</h3>
          <TaskList tasks={urgent.slice(0, 8)} />
        </section>
        <section>
          <h3>Meetings</h3>
          <TaskList tasks={meetings.slice(0, 6)} />
        </section>
      </div>
      <p className="fine">{done.length} marked done in this view. {snap.me.gamification ? snap.milestones.label : "Progress extras are off."}</p>
      <h3>Announcements</h3>
      {snap.announcements.length === 0 ? <p className="empty">The board is clear.</p> : null}
      <ul className="notes">
        {snap.announcements.map((note) => (
          <li key={note.id} className={isNewNote(note, snap, newSince) ? "fresh" : undefined}>
            {isNewNote(note, snap, newSince) ? <span className="new-badge">New</span> : null}
            <p>{note.body}</p>
            <span>{note.authorName} · {note.timeLabel}</span>
            {note.authorSlug === snap.me.slug || snap.me.role === "admin" ? (
              <button type="button" className="texty" disabled={busy} onClick={() => act({ type: "deleteAnnounce", id: note.id })}>Remove</button>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          void act({ type: "announce", body }).then(() => setBody(""));
        }}
      >
        <label htmlFor="announce">Pin a note</label>
        <textarea id="announce" maxLength={280} value={body} onChange={(event) => setBody(event.target.value)} placeholder="A short note for the team" />
        <button type="submit" className="pxbtn" disabled={busy || !body.trim()}>Pin it</button>
      </form>
    </Window>
  );
}

export function isNewNote(note: Snapshot["announcements"][number], snap: Snapshot, since: string | null | undefined) {
  return Boolean(since && note.authorSlug !== snap.me.slug && note.createdAt > since);
}

function TaskList({ tasks }: { tasks: TaskItem[] }) {
  if (!tasks.length) return <p className="empty">None.</p>;
  return (
    <ul className="plain-list">
      {tasks.map((task) => (
        <li key={task.id}><strong><TaskTitle title={task.title} /></strong> <span>{task.assigneeName} · {task.dueLabel}</span></li>
      ))}
    </ul>
  );
}

export function DeskPanel({
  snap,
  busy,
  act,
  slug,
  onClose,
  openPanel,
}: {
  snap: Snapshot;
  busy: boolean;
  act: Act;
  slug: StaffSlug;
  onClose?: () => void;
  openPanel: (id: PanelId) => void;
}) {
  const person = snap.staff.find((item) => item.slug === slug) ?? snap.me;
  const mine = person.slug === snap.me.slug;
  const tasks = snap.tasks.filter((task) => task.assignee === person.slug && task.status !== "done");
  const done = snap.tasks.filter((task) => task.assignee === person.slug && task.status === "done").slice(0, 6);
  const projects = [...new Set(tasks.map((task) => task.project))];
  const [notes, setNotes] = useState(mine ? snap.me.notes : "");
  return (
    <Window title={mine ? "My computer" : `${person.characterName}'s desk`} onClose={onClose}>
      <div className="desk-head">
        <Sprite appearance={person.appearance} scale={4} animate={!snap.me.calm && person.online} />
        <div>
          <h3>{person.characterName}</h3>
          <p>{person.title}</p>
          <p className="meta">{person.online ? statusLabel(person.status) : "Offline at the desk"}</p>
          {mine ? <button type="button" className="texty" onClick={() => openPanel("profile")}>Character and achievements</button> : null}
        </div>
      </div>
      <h3>Today</h3>
      <TaskList tasks={byTime(tasks.filter((task) => task.today))} />
      <h3>Open deadlines</h3>
      <TaskList tasks={tasks.filter((task) => task.overdue || task.date >= snap.today).slice(0, 8)} />
      <h3>Projects</h3>
      {projects.length ? <p>{projects.join(", ")}</p> : <p className="empty">No open project tags.</p>}
      <h3>Recently finished</h3>
      <TaskList tasks={done} />
      {mine ? <FocusTimer snap={snap} busy={busy} act={act} /> : null}
      {mine ? (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void act({ type: "notes", notes });
          }}
        >
          <label htmlFor="notes">Personal notes</label>
          <textarea id="notes" value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} placeholder="Scratch pad for today. Only you can see this." />
          <button type="submit" className="pxbtn" disabled={busy}>Save notes</button>
        </form>
      ) : (
        <p className="fine">Notes stay on each person&apos;s own desk.</p>
      )}
    </Window>
  );
}

export function ProfilePanel({
  snap,
  busy,
  act,
  onClose,
  onEdit,
  onLogout,
}: {
  snap: Snapshot;
  busy: boolean;
  act: Act;
  onClose?: () => void;
  onEdit: () => void;
  onLogout: () => void;
}) {
  const me = snap.me;
  return (
    <Window title="My character" onClose={onClose}>
      <div className="desk-head">
        <Sprite appearance={me.appearance} scale={5} animate={!me.calm} />
        <div>
          <h3>{me.characterName}</h3>
          <p>{me.title}</p>
          {me.gamification ? (
            <div>
              <p>Level {me.level}</p>
              <div className="xp" aria-label={`${me.levelInto} of ${me.levelNeed} towards the next level`}>
                <span style={{ width: `${Math.min(100, (me.levelInto / me.levelNeed) * 100)}%` }} />
              </div>
              <p className="fine">{me.xp} XP. Quests never reward long hours.</p>
            </div>
          ) : (
            <p className="fine">Progress extras are off.</p>
          )}
        </div>
      </div>
      <button type="button" className="pxbtn" onClick={onEdit}>Change this look</button>
      {me.gamification ? (
        <ul className="notes">
          {Object.entries(ACHIEVEMENTS).map(([id, item]) => (
            <li key={id} className={me.achievements.includes(id) ? "" : "locked"}>
              <strong>{item.name}</strong>
              <p>{me.achievements.includes(id) ? item.detail : "Still locked."}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="toggles">
        <label><input type="checkbox" checked={me.gamification} disabled={busy} onChange={(event) => act({ type: "preferences", gamification: event.target.checked })} /> Show XP and unlocks</label>
        <label><input type="checkbox" checked={me.sound} disabled={busy} onChange={(event) => act({ type: "preferences", sound: event.target.checked })} /> Office sounds</label>
        <label><input type="checkbox" checked={me.calm} disabled={busy} onChange={(event) => act({ type: "preferences", calm: event.target.checked })} /> Calmer motion</label>
        <label><input type="checkbox" checked={me.plainMode} disabled={busy} onChange={(event) => act({ type: "preferences", plainMode: event.target.checked })} /> Open the plain task list next time</label>
      </div>
      <div className="row-actions">
        <Link className="pxbtn alt" href="/team-access/">Dashboards</Link>
        <Link className="pxbtn alt" href="/pixel/plain/">Plain task list</Link>
        <button type="button" className="pxbtn alt" onClick={onLogout}>Sign out</button>
      </div>
    </Window>
  );
}

export function NotionPanel({ snap, busy, act, onClose }: { snap: Snapshot; busy: boolean; act: Act; onClose?: () => void }) {
  const mapping = snap.notion.mapping;
  const [databaseId, setDatabaseId] = useState(mapping?.tasksDatabaseId || "");
  const [titleProp, setTitleProp] = useState(mapping?.titleProp || "");
  const [assigneeProp, setAssigneeProp] = useState(mapping?.assigneeProp || "");
  const [dateProp, setDateProp] = useState(mapping?.dateProp || "");
  const [statusProp, setStatusProp] = useState(mapping?.statusProp || "");
  const [priorityProp, setPriorityProp] = useState(mapping?.priorityProp || "");
  const [projectProp, setProjectProp] = useState(mapping?.projectProp || "");
  const [typeProp, setTypeProp] = useState(mapping?.typeProp || "");
  const [doneValues, setDoneValues] = useState(mapping?.doneValues || "Done, Completed");
  const [meetingValues, setMeetingValues] = useState(mapping?.meetingValues || "Meeting");
  const [staffMap, setStaffMap] = useState(mapping?.staff || { max: "", tash: "", mariette: "", natasha: "" });
  const [schema, setSchema] = useState<{ properties: { name: string; type: string }[]; users: { id: string; name: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function readSchema() {
    setError(null);
    const result = await act({ type: "notionSchema", databaseId });
    if (result && "schema" in result && result.schema) setSchema(result.schema);
    if (result && !result.ok) setError(result.error || "Could not read Notion.");
  }

  const properties = schema?.properties ?? [];
  const field = (label: string, value: string, set: (value: string) => void) => (
    <label>
      {label}
      <select value={value} onChange={(event) => set(event.target.value)}>
        <option value="">Not mapped</option>
        {value && !properties.some((item) => item.name === value) ? <option value={value}>{value}</option> : null}
        {properties.map((item) => (
          <option key={item.name} value={item.name}>{item.name} ({item.type})</option>
        ))}
      </select>
    </label>
  );

  return (
    <Window title="Link Notion" onClose={onClose}>
      <p>Read-only. The three task trackers are linked. A task named Not started stays open, and In progress shows as in progress.</p>
      {!snap.notion.configured ? <p className="banner">Notion is not connected yet. Add the integration token on the server, share the task database with it, then map the columns here.</p> : null}
      {error ? <p className="banner warn">{error}</p> : null}
      <div className="stack">
        <label htmlFor="dbid">Database ID</label>
        <input id="dbid" value={databaseId} onChange={(event) => setDatabaseId(event.target.value)} placeholder="One database id, or several separated by commas" />
        <button type="button" className="pxbtn alt" disabled={busy || !databaseId} onClick={() => void readSchema()}>Read properties</button>
        {field("Title", titleProp, setTitleProp)}
        {field("Assignee (people)", assigneeProp, setAssigneeProp)}
        {field("Date", dateProp, setDateProp)}
        {field("Status", statusProp, setStatusProp)}
        {field("Priority", priorityProp, setPriorityProp)}
        {field("Project", projectProp, setProjectProp)}
        {field("Type or meeting", typeProp, setTypeProp)}
        <label>Done status names<input value={doneValues} onChange={(event) => setDoneValues(event.target.value)} /></label>
        <label>Meeting type names<input value={meetingValues} onChange={(event) => setMeetingValues(event.target.value)} /></label>
        {snap.staff.map((person) => (
          <label key={person.slug}>
            {person.name}&apos;s Notion user
            <select value={staffMap[person.slug] || ""} onChange={(event) => setStaffMap({ ...staffMap, [person.slug]: event.target.value })}>
              <option value="">Not linked</option>
              {schema?.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              {staffMap[person.slug] && !schema?.users.some((user) => user.id === staffMap[person.slug]) ? <option value={staffMap[person.slug]}>Saved user</option> : null}
            </select>
          </label>
        ))}
        <button
          type="button"
          className="pxbtn"
          disabled={busy}
          onClick={() =>
            act({
              type: "notionSave",
              mapping: {
                tasksDatabaseId: databaseId,
                titleProp,
                assigneeProp,
                dateProp,
                statusProp,
                priorityProp,
                projectProp,
                typeProp,
                doneValues,
                meetingValues,
                staff: staffMap,
              },
            })
          }
        >
          Save mapping
        </button>
        <button type="button" className="pxbtn alt" disabled={busy} onClick={() => act({ type: "notionRefresh" })}>Refresh now</button>
      </div>
    </Window>
  );
}

function remaining(endsAt: string, now: number) {
  const left = Math.max(0, Math.round((Date.parse(endsAt) - now) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

export function FocusClock({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <time dateTime={endsAt}>{remaining(endsAt, now)}</time>;
}

function FocusTimer({ snap, busy, act }: { snap: Snapshot; busy: boolean; act: Act }) {
  return (
    <div className="block">
      <h3>Focus timer</h3>
      {snap.focus ? (
        <>
          <p className="focus-clock">
            <FocusClock endsAt={snap.focus.endsAt} /> left
          </p>
          <p className="fine">Your status says Focusing until the timer ends.</p>
          <button type="button" className="pxbtn alt tiny" disabled={busy} onClick={() => act({ type: "focusStop" })}>
            Stop early
          </button>
        </>
      ) : (
        <>
          <p className="fine">
            Sets your status to Focusing so the team knows you&apos;re heads down.
            {snap.me.gamification ? " Finishing one gives a little XP, up to four a day." : ""}
          </p>
          <div className="row-actions">
            {[25, 50].map((minutes) => (
              <button key={minutes} type="button" className="pxbtn tiny" disabled={busy} onClick={() => act({ type: "focusStart", minutes })}>
                Focus {minutes} min
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function StandupPanel({ snap, onClose, openPanel }: { snap: Snapshot; onClose?: () => void; openPanel: (id: PanelId) => void }) {
  const open = snap.tasks.filter((task) => task.status !== "done");
  const meetings = byTime(open.filter((task) => task.kind === "meeting" && task.today));
  return (
    <Window title="Morning stand-up" onClose={onClose}>
      <p className="fine">{prettyDate(snap.today)}. Everyone&apos;s day at a glance.</p>
      {meetings.length ? (
        <div className="block">
          <h3>Meetings today</h3>
          <ul className="plain-list">
            {meetings.map((task) => (
              <li key={task.id}>
                <strong><TaskTitle title={task.title} /></strong> <span>{[task.time, task.assigneeName].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {snap.staff.map((person) => {
        const theirs = open.filter((task) => task.assignee === person.slug);
        const today = byTime(theirs.filter((task) => task.today && task.kind !== "meeting"));
        const doing = theirs.filter((task) => task.status === "doing" && !task.today);
        const overdue = theirs.filter((task) => task.overdue);
        return (
          <section key={person.slug} className="standup-person">
            <header>
              <i style={{ background: person.accent }} aria-hidden="true" />
              <strong>{person.name}</strong>
              <span className="meta">{person.online ? statusLabel(person.status) : "Offline"}</span>
            </header>
            <StandupList label="Today" tasks={today} empty="Nothing dated today." />
            {doing.length ? <StandupList label="In progress" tasks={doing} /> : null}
            {overdue.length ? <StandupList label="Overdue" tasks={overdue} warn /> : null}
          </section>
        );
      })}
      <div className="row-actions">
        <button type="button" className="pxbtn alt tiny" onClick={() => openPanel("quests")}>Quest journal</button>
      </div>
    </Window>
  );
}

function StandupList({ label, tasks, empty, warn }: { label: string; tasks: TaskItem[]; empty?: string; warn?: boolean }) {
  const shown = tasks.slice(0, 4);
  return (
    <div className="standup-list">
      <h3 className={warn ? "warn" : undefined}>{label}{tasks.length ? ` (${tasks.length})` : ""}</h3>
      {shown.length ? (
        <ul className="plain-list">
          {shown.map((task) => (
            <li key={task.id}>
              <strong><TaskTitle title={task.title} /></strong>{" "}
              <span>
                {[task.time, task.project !== "General" ? task.project : "", warn ? task.dueLabel : ""].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
          {tasks.length > shown.length ? <li className="meta">and {tasks.length - shown.length} more</li> : null}
        </ul>
      ) : (
        <p className="empty">{empty}</p>
      )}
    </div>
  );
}

type ClientLook = { slug: string; name: string; updatedAt: string | null; insights: Insight[] };

export function ClientPanel({ slug, name, onClose }: { slug: string; name: string; onClose?: () => void }) {
  const [look, setLook] = useState<ClientLook | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/pixel/client/?slug=${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? (response.json() as Promise<ClientLook>) : Promise.reject(new Error("failed"))))
      .then((data) => {
        if (live) setLook(data);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [slug]);

  return (
    <Window title={name} onClose={onClose}>
      {failed ? <p className="banner warn">Could not load this client&apos;s figures.</p> : null}
      {!look && !failed ? <p className="empty">Fetching the latest figures...</p> : null}
      {look && !look.insights.length ? <p className="empty">No figures synced for this client yet.</p> : null}
      {look?.insights.map((insight, index) => (
        <details key={insight.id} className="block" open={index === 0}>
          <summary>{insight.question}</summary>
          {insight.answer.map((line, lineIndex) => (
            <p key={lineIndex}>{line}</p>
          ))}
        </details>
      ))}
      {look?.updatedAt ? (
        <p className="fine">Updated {new Date(look.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.</p>
      ) : null}
      <a className="pxbtn alt" href={`/${slug}/`}>Open the full dashboard</a>
    </Window>
  );
}

export function WrapupPanel({ snap, onClose, onParty }: { snap: Snapshot; onClose?: () => void; onParty?: () => void }) {
  const [monday, , , , friday, , sunday] = snap.wrapup.week;
  const isFriday = snap.today === friday;
  const weekStart = `${monday}T00:00:00`;
  const finished = snap.tasks.filter((task) => task.status === "done" && task.completedAt && task.completedAt >= weekStart);
  const focusTotal = Object.values(snap.wrapup.focus).reduce((sum, count) => sum + count, 0);
  const notes = snap.announcements.filter((note) => note.createdAt >= weekStart).length;
  const nextWeek = new Set(weekKeys(shiftKey(sunday, 1)));
  return (
    <Window title={isFriday ? "Friday wrap-up" : "The week so far"} onClose={onClose}>
      <p className="fine">Week of {prettyDate(monday)}.</p>
      <div className="wrap-totals">
        <p><strong>{finished.length}</strong> tasks ticked off</p>
        <p><strong>{focusTotal}</strong> focus sessions</p>
        <p><strong>{notes}</strong> notes pinned</p>
      </div>
      {snap.staff.map((person) => {
        const theirs = finished
          .filter((task) => task.assignee === person.slug)
          .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
        const due = snap.tasks.filter((task) => task.assignee === person.slug && task.status !== "done" && nextWeek.has(task.date)).length;
        const focus = snap.wrapup.focus[person.slug] || 0;
        return (
          <section key={person.slug} className="standup-person">
            <header>
              <i style={{ background: person.accent }} aria-hidden="true" />
              <strong>{person.name}</strong>
              <span className="meta">
                {theirs.length} done{focus ? ` · ${focus} focus` : ""}
              </span>
            </header>
            {theirs.length ? (
              <ul className="plain-list">
                {theirs.slice(0, 5).map((task) => (
                  <li key={task.id}>
                    <strong><TaskTitle title={task.title} /></strong> {task.project !== "General" ? <span>{task.project}</span> : null}
                  </li>
                ))}
                {theirs.length > 5 ? <li className="meta">and {theirs.length - 5} more</li> : null}
              </ul>
            ) : (
              <p className="empty">No Notion tasks logged this week.</p>
            )}
            {due ? <p className="meta">{due} due next week.</p> : null}
          </section>
        );
      })}
      <p className="fine">
        This only counts what&apos;s ticked off in Notion. Plenty happens behind the scenes that never makes it onto a list.
        {isFriday ? " Have a good weekend." : ""}
      </p>
      {isFriday && onParty ? (
        <button type="button" className="pxbtn" onClick={onParty}>
          Start the Friday party
        </button>
      ) : null}
    </Window>
  );
}

export { STATUSES };
