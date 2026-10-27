"use client";

import { useMemo, useState } from "react";
import { Sprite } from "@/pixel/components/Sprite";
import { Window } from "@/pixel/components/Window";
import { monthLabel, prettyDate, weekKeys } from "@/pixel/lib/format";
import { ACHIEVEMENTS } from "@/pixel/lib/xp";
import { STATUSES, statusLabel } from "@/pixel/game/options";
import type { ActionBody, ActionResult, PanelId, Snapshot, StaffSlug, TaskItem } from "@/pixel/types";

type Act = (body: ActionBody) => Promise<ActionResult | void>;

function byTime(tasks: TaskItem[]) {
  return [...tasks].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.title.localeCompare(b.title));
}

export function DayPanel({ snap, onClose, openPanel }: { snap: Snapshot; onClose?: () => void; openPanel: (id: PanelId) => void }) {
  const mine = byTime(snap.tasks.filter((task) => task.assignee === snap.me.slug && task.today && task.status !== "done"));
  const overdue = snap.tasks.filter((task) => task.assignee === snap.me.slug && task.overdue);
  const upcoming = snap.tasks.filter((task) => task.assignee === snap.me.slug && task.date > snap.today && task.status !== "done").slice(0, 5);
  return (
    <Window id="today" title={`${snap.me.name.toUpperCase()}'S DAY`} onClose={onClose}>
      {snap.notion.mode === "demo" ? <p className="banner">Demo tasks. Not from Notion.</p> : null}
      {snap.notion.message ? <p className="banner warn">{snap.notion.message}</p> : null}
      {mine.length === 0 ? <p className="empty">Nothing dated for today. The office plant still believes in you.</p> : null}
      <ol className="day-list">
        {mine.map((task) => (
          <li key={task.id}>
            <time>{task.time || "Anytime"}</time>
            <div>
              <strong>{task.title}</strong>
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
              <li key={task.id}>{task.title} <span>{task.dueLabel}</span></li>
            ))}
          </ul>
        </div>
      ) : null}
      {upcoming.length ? (
        <details className="block">
          <summary>Later this week</summary>
          <ul className="plain-list">
            {upcoming.map((task) => (
              <li key={task.id}>{task.dueLabel} · {task.title}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="row-actions">
        <button type="button" className="pxbtn" onClick={() => openPanel("quests")}>Open the quest journal</button>
        <button type="button" className="pxbtn alt" onClick={() => openPanel("calendar")}>Calendar</button>
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
  filter: "mine" | "all" | "meetings";
  setFilter: (value: "mine" | "all" | "meetings") => void;
}) {
  const tasks = byTime(
    snap.tasks.filter((task) => {
      if (filter === "mine") return task.assignee === snap.me.slug;
      if (filter === "meetings") return task.kind === "meeting";
      return true;
    }),
  );
  return (
    <Window title="Quest journal" onClose={onClose}>
      <div className="filters" role="tablist" aria-label="Quest filter">
        {(["mine", "all", "meetings"] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? "chip on" : "chip"} onClick={() => setFilter(value)} aria-pressed={filter === value}>
            {value === "mine" ? "Mine" : value === "all" ? "Whole team" : "Meetings"}
          </button>
        ))}
      </div>
      {snap.notion.mode !== "demo" ? <p className="fine">Notion is read-only. A local preview does not complete the Notion page.</p> : null}
      {tasks.length === 0 ? <p className="empty">No quests in this view.</p> : null}
      <ul className="quests">
        {tasks.map((task) => {
          const mine = task.assignee === snap.me.slug || task.assignee === null;
          const done = task.status === "done";
          return (
            <li key={task.id} className={done ? "quest done" : "quest"}>
              <i className={`seal ${task.priority}`} title={task.priority} aria-hidden="true" />
              <div>
                <strong>{task.title}</strong>
                <p>{task.detail || task.project}</p>
                <p className="meta">
                  {task.project} · {task.assigneeName} · {task.dueLabel} · {task.priority} priority
                  {task.kind === "meeting" ? " · Meeting" : ""} · {done ? "Done" : task.status === "doing" ? "In progress" : "Open"}
                  {snap.me.gamification && task.source === "demo" ? ` · ${task.xp} XP` : ""}
                  {task.localPreview ? " · Local preview" : ""}
                </p>
                {task.notionUrl ? <a href={task.notionUrl} target="_blank" rel="noreferrer">Open in Notion</a> : null}
              </div>
              {mine && !done && task.source === "demo" ? (
                <button type="button" className="pxbtn tiny" disabled={busy} onClick={() => act({ type: "complete", taskId: task.id })}>
                  Mark done
                </button>
              ) : null}
              {mine && !done && task.source === "notion" && !task.localPreview ? (
                <button type="button" className="pxbtn alt tiny" disabled={busy} onClick={() => act({ type: "complete", taskId: task.id })}>
                  Preview locally
                </button>
              ) : null}
              {done ? <span className="done-mark">Done</span> : null}
              {task.localPreview && !done ? <span className="done-mark">Preview</span> : null}
            </li>
          );
        })}
      </ul>
    </Window>
  );
}

export function TeamPanel({ snap, busy, act, onClose }: { snap: Snapshot; busy: boolean; act: Act; onClose?: () => void }) {
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
          <li key={note.id}>
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

function TaskList({ tasks }: { tasks: TaskItem[] }) {
  if (!tasks.length) return <p className="empty">None.</p>;
  return (
    <ul className="plain-list">
      {tasks.map((task) => (
        <li key={task.id}><strong>{task.title}</strong> <span>{task.assigneeName} · {task.dueLabel}</span></li>
      ))}
    </ul>
  );
}

function CalendarTasks({ tasks, onOpen }: { tasks: TaskItem[]; onOpen: (task: TaskItem) => void }) {
  if (!tasks.length) return <p className="empty">Nothing scheduled for this filter.</p>;
  return (
    <ul className="cal-tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          <button type="button" className={task.status === "done" ? "cal-task done" : "cal-task"} onClick={() => onOpen(task)}>
            <strong>{task.title}</strong>
            <span>{task.time || "Anytime"} · {task.assigneeName} · {task.project}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CalendarPanel({ snap, onClose }: { snap: Snapshot; onClose?: () => void }) {
  const [view, setView] = useState<"today" | "week" | "month">("today");
  const [monthCursor, setMonthCursor] = useState(snap.today.slice(0, 7));
  const [monthDay, setMonthDay] = useState(snap.today);
  const [picked, setPicked] = useState<StaffSlug[]>(snap.staff.map((person) => person.slug));
  const [showDone, setShowDone] = useState(false);
  const [selected, setSelected] = useState<TaskItem | null>(null);
  const visible = snap.tasks.filter((task) => task.date && (showDone || task.status !== "done") && (picked.length === 0 || (task.assignee ? picked.includes(task.assignee) : true)));
  const week = weekKeys(snap.today);
  const month = useMemo(() => monthGrid(monthCursor), [monthCursor]);

  function moveMonth(delta: number) {
    const next = shiftMonth(monthCursor, delta);
    setMonthCursor(next);
    setMonthDay(next === snap.today.slice(0, 7) ? snap.today : `${next}-01`);
  }

  function toggle(slug: StaffSlug) {
    setPicked((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }

  return (
    <Window title="Wall calendar" onClose={onClose}>
      <div className="filters">
        {(["today", "week", "month"] as const).map((value) => (
          <button key={value} type="button" className={view === value ? "chip on" : "chip"} onClick={() => setView(value)} aria-pressed={view === value}>
            {value === "today" ? "Today" : value === "week" ? "This week" : "This month"}
          </button>
        ))}
      </div>
      <div className="filters" aria-label="Filter by employee">
        <button type="button" className={showDone ? "chip on" : "chip"} onClick={() => setShowDone((current) => !current)} aria-pressed={showDone}>Show finished</button>
        <button type="button" className="chip" onClick={() => setPicked(snap.staff.map((person) => person.slug))}>Everyone</button>
        {snap.staff.map((person) => (
          <button key={person.slug} type="button" className={picked.includes(person.slug) ? "chip on" : "chip"} onClick={() => toggle(person.slug)} aria-pressed={picked.includes(person.slug)}>
            <i style={{ background: person.accent }} aria-hidden="true" /> {person.name}
          </button>
        ))}
      </div>
      {view === "today" ? <CalendarTasks tasks={byTime(visible.filter((task) => task.date === snap.today))} onOpen={setSelected} /> : null}
      {view === "week" ? (
        <div className="cal-days">
          {week.filter((day) => day === snap.today || visible.some((task) => task.date === day)).map((day) => (
            <section key={day} className={day === snap.today ? "cal-day today" : "cal-day"}>
              <h3>{prettyDate(day)}</h3>
              <CalendarTasks tasks={byTime(visible.filter((task) => task.date === day))} onOpen={setSelected} />
            </section>
          ))}
        </div>
      ) : null}
      {view === "month" ? (
        <div>
          <div className="row-actions">
            <button type="button" className="pxbtn alt tiny" onClick={() => moveMonth(-1)}>Previous</button>
            <strong>{month.label}</strong>
            <button type="button" className="pxbtn alt tiny" onClick={() => moveMonth(1)}>Next</button>
          </div>
          <div className="month">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="dow">{day}</div>)}
            {Array.from({ length: month.pad }, (_, index) => <div key={`pad-${index}`} />)}
            {month.days.map((day) => {
              const key = `${monthCursor}-${String(day).padStart(2, "0")}`;
              const count = visible.filter((task) => task.date === key).length;
              const classes = ["cell", key === snap.today ? "today" : "", key === monthDay ? "on" : ""].filter(Boolean).join(" ");
              return (
                <button key={key} type="button" className={classes} onClick={() => setMonthDay(key)} aria-pressed={key === monthDay}>
                  <span>{day}</span>
                  {count ? <em>{count}</em> : null}
                </button>
              );
            })}
          </div>
          <CalendarTasks tasks={byTime(visible.filter((task) => task.date === monthDay))} onOpen={setSelected} />
        </div>
      ) : null}
      {selected ? (
        <div className="detail" role="dialog" aria-label={selected.title}>
          <h3>{selected.title}</h3>
          <p>{selected.detail || "No extra notes on this one."}</p>
          <p className="meta">{selected.project} · {selected.assigneeName} · {selected.dueLabel} · {selected.priority} · {selected.status}</p>
          {selected.notionUrl ? <a href={selected.notionUrl} target="_blank" rel="noreferrer">Open the Notion page</a> : <p className="fine">{selected.source === "demo" ? "Sample task. This one is not a page in Notion." : "This task has no Notion link."}</p>}
          <button type="button" className="pxbtn alt tiny" onClick={() => setSelected(null)}>Close detail</button>
        </div>
      ) : null}
    </Window>
  );
}

function monthGrid(cursor: string) {
  const [year, month] = cursor.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  return {
    label: monthLabel(`${cursor}-01`),
    pad: (first.getDay() + 6) % 7,
    days: Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1),
  };
}

function shiftMonth(cursor: string, delta: number) {
  const [year, month] = cursor.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function ProjectPanel({ snap, onClose }: { snap: Snapshot; onClose?: () => void }) {
  const [active, setActive] = useState(snap.projects[0]?.id ?? "");
  const project = snap.projects.find((item) => item.id === active) ?? snap.projects[0];
  const tasks = project ? snap.tasks.filter((task) => task.project === project.name) : [];
  return (
    <Window title="Project shelf" onClose={onClose}>
      {snap.projects.length === 0 ? <p className="empty">No projects in this view yet.</p> : null}
      <div className="folders">
        {snap.projects.map((item) => (
          <button key={item.id} type="button" className={item.id === project?.id ? "folder on" : "folder"} onClick={() => setActive(item.id)}>
            <i style={{ background: item.colour }} aria-hidden="true" />
            <strong>{item.name}</strong>
            <span>{item.done}/{item.total || 0} done</span>
          </button>
        ))}
      </div>
      {project ? (
        <div className="block">
          <h3>{project.client}</h3>
          <p>{project.summary}</p>
          <TaskList tasks={tasks} />
        </div>
      ) : null}
    </Window>
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
        <p className="fine">Notes stay on each person's own desk.</p>
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
        <a className="pxbtn alt" href="/team-access/">Dashboards</a>
        <a className="pxbtn alt" href="/pixel/plain/">Plain task list</a>
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

export { STATUSES };
