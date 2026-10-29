import { sqlOne, sqlRun } from "@/pixel/lib/db";
import { localKey } from "@/pixel/lib/format";
import type { NotionMapping, NotionSchema, Priority, StaffSlug, TaskItem, TaskKind, TaskStatus } from "@/pixel/types";

const SLUGS: StaffSlug[] = ["max", "tash", "mariette", "natasha"];

// The three task trackers inside MM DIGITAL HQ. Max does not have one there yet.
const OFFICE_TRACKERS = [
  "8fd25a60-b082-83a7-aec4-013a8cd0b416",
  "54a25a60-b082-8253-9f4b-018bffc020e5",
  "cfc25a60-b082-827e-b1a5-816633850d51",
];

const NOTION_PEOPLE: { id: string; name: string; slug: StaffSlug }[] = [
  { id: "38bd872b-594c-81a2-adb7-000287defdb1", name: "MM Digital", slug: "max" },
  { id: "38ed872b-594c-814f-a8c4-00022abcf2bc", name: "Tash", slug: "tash" },
  { id: "39cd872b-594c-813a-98de-00028e0fd8b1", name: "Mariette James", slug: "mariette" },
];

export function emptyMapping(): NotionMapping {
  return {
    tasksDatabaseId: process.env.NOTION_DATABASE_ID?.trim() || "",
    titleProp: "",
    assigneeProp: "",
    dateProp: "",
    statusProp: "",
    priorityProp: "",
    projectProp: "",
    typeProp: "",
    doneValues: "Done, Completed",
    meetingValues: "Meeting",
    staff: { max: "", tash: "", mariette: "", natasha: "" },
  };
}

export function officeMapping(): NotionMapping {
  const saved = readMapping();
  if (saved?.tasksDatabaseId && saved.titleProp && saved.dateProp) return saved;
  return {
    ...emptyMapping(),
    tasksDatabaseId: OFFICE_TRACKERS.join(","),
    titleProp: "Task name",
    assigneeProp: "Assignee",
    dateProp: "Due date",
    statusProp: "Status",
    priorityProp: "Priority",
    projectProp: "Client",
    doneValues: "Done, Completed",
    staff: {
      max: NOTION_PEOPLE[0].id,
      tash: NOTION_PEOPLE[1].id,
      mariette: NOTION_PEOPLE[2].id,
      natasha: "",
    },
  };
}

const TRACKER_OWNER: Record<string, StaffSlug> = {
  "8fd25a60b08283a7aec4013a8cd0b416": "tash",
  "54a25a60b08282539f4b018bffc020e5": "mariette",
  "cfc25a60b082827eb1a5816633850d51": "natasha",
};

function trackerOwner(id: string): StaffSlug | null {
  return TRACKER_OWNER[id.replace(/-/g, "").toLowerCase()] ?? null;
}

function databaseIds(mapping: NotionMapping) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of mapping.tasksDatabaseId.split(/[\s,]+/)) {
    const id = part.trim();
    const key = id.replace(/-/g, "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    ids.push(id);
  }
  return ids;
}

export function readMapping(): NotionMapping | null {
  const row = sqlOne<{ value: string }>("select value from settings where key = 'notion_mapping'");
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as Partial<NotionMapping>;
    const base = emptyMapping();
    return {
      ...base,
      ...parsed,
      staff: { ...base.staff, ...(parsed.staff ?? {}) },
    };
  } catch {
    return null;
  }
}

export function saveMapping(mapping: NotionMapping) {
  sqlRun(
    "insert into settings (key, value) values ('notion_mapping', ?) on conflict(key) do update set value = excluded.value",
    JSON.stringify(mapping),
  );
}

export function notionConfigured() {
  return Boolean(process.env.NOTION_TOKEN?.trim());
}

function cacheSeconds() {
  const value = Number(process.env.NOTION_CACHE_SECONDS || 120);
  return Number.isFinite(value) && value >= 15 ? value : 120;
}

async function notionFetch(path: string, init?: RequestInit) {
  const token = process.env.NOTION_TOKEN?.trim();
  if (!token) throw new Error("Notion token is not set.");
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": process.env.NOTION_VERSION?.trim() || "2022-06-28",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { message?: string; object?: string }) : {};
  if (!response.ok) {
    throw new Error(body.message || `Notion returned ${response.status}.`);
  }
  return body as Record<string, unknown>;
}

function plain(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const value = prop as {
    type?: string;
    title?: { plain_text?: string }[];
    rich_text?: { plain_text?: string }[];
    select?: { name?: string } | null;
    status?: { name?: string } | null;
    people?: { id?: string }[];
    date?: { start?: string } | null;
    multi_select?: { name?: string }[];
    formula?: { type?: string; string?: string | null };
    number?: number | null;
  };
  if (value.type === "title") return (value.title ?? []).map((part) => part.plain_text ?? "").join("");
  if (value.type === "rich_text") return (value.rich_text ?? []).map((part) => part.plain_text ?? "").join("");
  if (value.type === "select") return value.select?.name ?? "";
  if (value.type === "status") return value.status?.name ?? "";
  if (value.type === "people") return (value.people ?? []).map((person) => person.id ?? "").filter(Boolean).join(",");
  if (value.type === "date") return value.date?.start ?? "";
  if (value.type === "multi_select") return (value.multi_select ?? []).map((item) => item.name ?? "").join(", ");
  if (value.type === "number") return value.number == null ? "" : String(value.number);
  if (value.type === "formula" && value.formula?.type === "string") return value.formula.string ?? "";
  return "";
}

function splitDate(start: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) return { date: start, time: null as string | null };
  const parsed = new Date(start);
  if (Number.isNaN(parsed.getTime())) return { date: start.slice(0, 10), time: null };
  const time = `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  return { date: localKey(parsed), time };
}

function mapPriority(value: string): Priority {
  const text = value.toLowerCase();
  if (/urgent|critical|p1/.test(text)) return "urgent";
  if (/high|p2/.test(text)) return "high";
  if (/low|p4/.test(text)) return "low";
  return "normal";
}

// Same rewards as the demo quests, so Notion tasks level people up at the same pace.
const XP_BY_PRIORITY: Record<Priority, number> = { low: 15, normal: 25, high: 40, urgent: 40 };

export function notionXp(priority: Priority) {
  return XP_BY_PRIORITY[priority] ?? XP_BY_PRIORITY.normal;
}

function isNamed(value: string, configured: string, fallback: RegExp) {
  const list = configured
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const name = value.trim().toLowerCase();
  if (!name) return false;
  if (list.length) return list.includes(name);
  return fallback.test(name);
}

function names(): Record<StaffSlug, string> {
  return { max: "Max", tash: "Tash", mariette: "Mariette", natasha: "Natasha" };
}

function peopleDetails(prop: unknown): { id: string; name: string }[] {
  if (!prop || typeof prop !== "object") return [];
  const value = prop as { type?: string; people?: { id?: string; name?: string }[] };
  if (value.type !== "people") return [];
  return (value.people ?? [])
    .map((person) => ({ id: person.id ?? "", name: (person.name ?? "").trim() }))
    .filter((person) => person.id || person.name);
}

function slugFromName(name: string): StaffSlug | null {
  const text = name.trim().toLowerCase();
  if (/^tash\b/.test(text)) return "tash";
  if (/^mariette\b/.test(text)) return "mariette";
  if (/^natasha\b/.test(text)) return "natasha";
  if (/^(mm digital|maximilian|max)\b/.test(text)) return "max";
  return null;
}

export function normaliseNotionPages(results: Record<string, unknown>[], mapping: NotionMapping, today: string): TaskItem[] {
  const staffByNotion = new Map<string, StaffSlug>();
  for (const slug of SLUGS) {
    const id = mapping.staff[slug]?.trim();
    if (id) staffByNotion.set(id, slug);
  }
  const people = names();
  const tasks: TaskItem[] = [];
  for (const page of results) {
    if (page.archived || page.object !== "page") continue;
    const properties = (page.properties ?? {}) as Record<string, unknown>;
    const title = plain(properties[mapping.titleProp]);
    if (!title) continue;
    const dateRaw = mapping.dateProp ? plain(properties[mapping.dateProp]) : "";
    const when = dateRaw ? splitDate(dateRaw) : { date: "", time: null };
    const statusName = mapping.statusProp ? plain(properties[mapping.statusProp]) : "";
    const done = isNamed(statusName, mapping.doneValues, /^(done|complete|completed)$/i);
    const doing = isNamed(statusName, "", /^(in progress|doing|started)$/i);
    const status: TaskStatus = done ? "done" : doing ? "doing" : "todo";
    const typeName = mapping.typeProp ? plain(properties[mapping.typeProp]) : "";
    const kind: TaskKind = isNamed(typeName, mapping.meetingValues, /^$/) || /meeting/i.test(typeName) ? "meeting" : "task";
    const priority = mapPriority(mapping.priorityProp ? plain(properties[mapping.priorityProp]) : "");
    const project = (mapping.projectProp ? plain(properties[mapping.projectProp]) : "") || "General";
    const peopleOnTask = mapping.assigneeProp ? peopleDetails(properties[mapping.assigneeProp]) : [];
    const slugs: StaffSlug[] = [];
    for (const person of peopleOnTask) {
      const slug = staffByNotion.get(person.id) ?? slugFromName(person.name);
      if (slug && !slugs.includes(slug)) slugs.push(slug);
    }
    const owner = (page as { trackerOwner?: StaffSlug | null }).trackerOwner ?? null;
    const targets: Array<StaffSlug | null> = slugs.length ? slugs : [owner];
    const pageUrl = typeof page.url === "string" ? page.url : null;
    for (const assignee of targets) {
      tasks.push({
        id: assignee ? `notion:${String(page.id)}:${assignee}` : `notion:${String(page.id)}`,
        title,
        detail: "",
        project,
        assignee,
        assigneeName: assignee ? people[assignee] : "Unassigned",
        priority,
        status,
        kind,
        xp: notionXp(priority),
        source: "notion",
        date: when.date,
        time: when.time,
        dueLabel: when.date ? `${when.date}${when.time ? ` ${when.time}` : ""}` : "No date yet",
        notionUrl: pageUrl,
        localPreview: false,
        overdue: Boolean(when.date && when.date < today && status !== "done"),
        today: when.date === today,
      });
    }
  }
  return tasks;
}

export async function fetchNotionSchema(databaseId: string): Promise<NotionSchema> {
  const firstId = databaseIds({ ...emptyMapping(), tasksDatabaseId: databaseId })[0] || databaseId;
  const database = (await notionFetch(`/databases/${firstId}`)) as {
    properties?: Record<string, { type?: string }>;
  };
  const properties = Object.entries(database.properties ?? {})
    .map(([name, value]) => ({ name, type: value.type ?? "unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));
  let users = NOTION_PEOPLE.map((person) => ({ id: person.id, name: person.name }));
  try {
    const userPayload = (await notionFetch("/users")) as { results?: { id?: string; name?: string; type?: string }[] };
    const listed = (userPayload.results ?? [])
      .filter((user) => user.type !== "bot" && user.id)
      .map((user) => ({ id: user.id as string, name: user.name || `Notion user ${String(user.id).slice(-4)}` }));
    if (listed.length) users = listed;
  } catch {
    // A personal token cannot list every workspace user. The known people still match.
  }
  return { properties, users };
}

async function queryDatabase(databaseId: string) {
  const pages: Record<string, unknown>[] = [];
  let cursor = "";
  for (let page = 0; page < 4; page += 1) {
    const payload = (await notionFetch(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify(cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 }),
    })) as { results?: Record<string, unknown>[]; has_more?: boolean; next_cursor?: string | null };
    pages.push(...(payload.results ?? []));
    if (!payload.has_more || !payload.next_cursor) break;
    cursor = payload.next_cursor;
  }
  return pages;
}

export async function loadNotion(today: string, force = false): Promise<{ tasks: TaskItem[] | null; stateMessage: string | null; mode: "demo" | "live" | "stale"; age: number | null }> {
  const mapping = officeMapping();
  const ids = databaseIds(mapping);
  if (!notionConfigured()) {
    return { tasks: null, stateMessage: "Notion is not connected. These are demo tasks.", mode: "demo", age: null };
  }
  if (!ids.length || !mapping.titleProp || !mapping.dateProp) {
    return {
      tasks: null,
      stateMessage: "The Notion token is set. An administrator still needs to map the database.",
      mode: "demo",
      age: null,
    };
  }
  const cached = sqlOne<{ value: string }>("select value from settings where key = 'notion_cache'");
  const cachedAt = sqlOne<{ value: string }>("select value from settings where key = 'notion_cache_at'");
  const age = cachedAt ? Math.max(0, Math.round((Date.now() - Date.parse(cachedAt.value)) / 1000)) : null;
  if (!force && cached && age !== null && age < cacheSeconds()) {
    const tasks = readCachedTasks(cached.value);
    if (tasks) return { tasks: retag(tasks, today), stateMessage: null, mode: "live", age };
  }
  try {
    const pages: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      const owner = trackerOwner(id);
      for (const page of await queryDatabase(id)) {
        const pageId = String(page.id ?? "");
        if (pageId && seen.has(pageId)) continue;
        if (pageId) seen.add(pageId);
        pages.push({ ...page, trackerOwner: owner });
      }
    }
    const tasks = normaliseNotionPages(pages, mapping, today);
    sqlRun("insert into settings (key, value) values ('notion_cache', ?) on conflict(key) do update set value = excluded.value", JSON.stringify(tasks));
    sqlRun("insert into settings (key, value) values ('notion_cache_at', ?) on conflict(key) do update set value = excluded.value", new Date().toISOString());
    sqlRun("insert into settings (key, value) values ('notion_error', '') on conflict(key) do update set value = ''");
    return { tasks, stateMessage: null, mode: "live", age: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notion could not be reached.";
    sqlRun("insert into settings (key, value) values ('notion_error', ?) on conflict(key) do update set value = excluded.value", message);
    if (cached) {
      const tasks = readCachedTasks(cached.value);
      if (tasks) return { tasks: retag(tasks, today), stateMessage: `Showing the last Notion copy. ${message}`, mode: "stale", age };
    }
    return { tasks: null, stateMessage: `${message} Showing demo tasks instead.`, mode: "demo", age: null };
  }
}

function readCachedTasks(value: string): TaskItem[] | null {
  try {
    const tasks = JSON.parse(value) as TaskItem[];
    return Array.isArray(tasks) ? tasks : null;
  } catch {
    return null;
  }
}

function retag(tasks: TaskItem[], today: string) {
  return tasks.map((task) => ({
    ...task,
    xp: notionXp(task.priority),
    overdue: Boolean(task.date && task.date < today && task.status !== "done"),
    today: task.date === today,
    dueLabel: task.date ? `${task.date}${task.time ? ` ${task.time}` : ""}` : "No date yet",
  }));
}

export function cleanMapping(input: Partial<NotionMapping> | null): NotionMapping {
  const base = emptyMapping();
  const text = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, 180) : "");
  return {
    tasksDatabaseId: text(input?.tasksDatabaseId) || base.tasksDatabaseId,
    titleProp: text(input?.titleProp),
    assigneeProp: text(input?.assigneeProp),
    dateProp: text(input?.dateProp),
    statusProp: text(input?.statusProp),
    priorityProp: text(input?.priorityProp),
    projectProp: text(input?.projectProp),
    typeProp: text(input?.typeProp),
    doneValues: text(input?.doneValues) || base.doneValues,
    meetingValues: text(input?.meetingValues) || base.meetingValues,
    staff: {
      max: text(input?.staff?.max),
      tash: text(input?.staff?.tash),
      mariette: text(input?.staff?.mariette),
      natasha: text(input?.staff?.natasha),
    },
  };
}

export function notionPageId(taskId: string) {
  const match = /^notion:([0-9a-f-]{32,36})(?::(?:max|tash|mariette|natasha))?$/i.exec(taskId);
  return match?.[1] ?? null;
}

export async function markNotionDone(pageId: string) {
  const mapping = officeMapping();
  const statusProp = mapping.statusProp || "Status";
  const doneName = mapping.doneValues.split(",")[0]?.trim() || "Done";
  const page = (await notionFetch(`/pages/${pageId}`)) as { properties?: Record<string, { type?: string }> };
  const kind = page.properties?.[statusProp]?.type;
  if (kind !== "status" && kind !== "select") throw new Error("That Notion task has no status to update.");
  const value = kind === "status" ? { status: { name: doneName } } : { select: { name: doneName } };
  await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: { [statusProp]: value } }),
  });
}
