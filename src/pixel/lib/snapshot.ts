import { canEditClientLights, clientsByHealth } from "@/lib/client-health";
import { emptyClientForm, loadClientForm } from "@/lib/metrics/load-form";
import { SEATS } from "@/pixel/game/layout";
import { cleanAppearance, DEFAULTS, statusLabel } from "@/pixel/game/options";
import { sqlAll, sqlOne, sqlRun, type StaffRow, type TaskRow } from "@/pixel/lib/db";
import { clockLabel, localKey, prettyDate, shiftKey } from "@/pixel/lib/format";
import { savedClientLights } from "@/pixel/lib/lights";
import { loadNotion, notionConfigured, officeMapping } from "@/pixel/lib/notion";
import { levelProgress, milestone } from "@/pixel/lib/xp";
import type { Announcement, Appearance, ProjectItem, Snapshot, StaffPublic, StaffSlug, Status, TaskItem } from "@/pixel/types";

const SLUGS: StaffSlug[] = ["max", "tash", "mariette", "natasha"];
const NAMES: Record<StaffSlug, string> = { max: "Max", tash: "Tash", mariette: "Mariette", natasha: "Natasha" };

function isSlug(value: string | null | undefined): value is StaffSlug {
  return !!value && (SLUGS as string[]).includes(value);
}

function grantAchievement(row: StaffRow, id: string): StaffRow {
  let list: string[] = [];
  try {
    const parsed = JSON.parse(row.achievements) as unknown;
    if (Array.isArray(parsed)) list = parsed.filter((item) => typeof item === "string");
  } catch {
    list = [];
  }
  if (list.includes(id)) return row;
  list.push(id);
  const achievements = JSON.stringify(list);
  sqlRun("update staff set achievements = ? where id = ?", achievements, row.id);
  return { ...row, achievements };
}

function appearanceFor(row: StaffRow, level: number): Appearance {
  try {
    const parsed = JSON.parse(row.appearance) as Appearance;
    return cleanAppearance(parsed, level, false).appearance;
  } catch {
    return DEFAULTS[isSlug(row.slug) ? row.slug : "max"];
  }
}

export function toPublic(row: StaffRow, viewerSlug: string): StaffPublic {
  const slug = (isSlug(row.slug) ? row.slug : "max") as StaffSlug;
  const xp = Number(row.xp) || 0;
  const progress = levelProgress(xp);
  const online = !!row.last_seen && Date.now() - Date.parse(row.last_seen) < 35000;
  const seat = SEATS[slug];
  const x = online && row.pos_x != null ? row.pos_x : seat.x;
  const y = online && row.pos_y != null ? row.pos_y : seat.y;
  let achievements: string[] = [];
  try {
    const parsed = JSON.parse(row.achievements) as unknown;
    if (Array.isArray(parsed)) achievements = parsed.filter((item) => typeof item === "string");
  } catch {
    achievements = [];
  }
  return {
    id: row.id,
    slug,
    name: row.display_name,
    characterName: row.character_name || row.display_name,
    title: row.title,
    role: row.role,
    accent: row.accent,
    appearance: appearanceFor(row, progress.level),
    creatorDone: Number(row.creator_done) === 1,
    xp,
    level: progress.level,
    levelInto: progress.into,
    levelNeed: progress.need,
    status: (row.status as Status) || "working",
    notes: row.slug === viewerSlug ? row.notes : "",
    gamification: Number(row.gamification) === 1,
    sound: Number(row.sound) === 1,
    calm: Number(row.calm) === 1,
    plainMode: Number(row.plain_mode) === 1,
    achievements,
    online,
    x,
    y,
    sitting: Number(row.sitting) === 1,
  };
}

function demoTasks(today: string): TaskItem[] {
  const rows = sqlAll<TaskRow>("select * from tasks where source = 'demo'");
  return rows.map((row) => {
    const date = row.day_offset == null ? "" : shiftKey(today, row.day_offset);
    const assignee = isSlug(row.assignee_slug) ? row.assignee_slug : null;
    const status = row.status === "done" || row.status === "doing" ? row.status : "todo";
    return {
      id: row.id,
      title: row.title,
      detail: row.detail,
      project: row.project_name,
      assignee,
      assigneeName: assignee ? NAMES[assignee] : "Unassigned",
      priority: (row.priority as TaskItem["priority"]) || "normal",
      status,
      kind: row.kind === "meeting" ? "meeting" : "task",
      xp: row.xp_reward,
      source: "demo",
      date,
      time: row.time_of_day,
      dueLabel: date ? `${prettyDate(date)}${row.time_of_day ? ` · ${row.time_of_day}` : ""}` : "No date yet",
      notionUrl: null,
      localPreview: false,
      overdue: Boolean(date && date < today && status !== "done"),
      today: date === today,
    };
  });
}

function withPreviews(tasks: TaskItem[], slug: string) {
  const rows = sqlAll<{ external_id: string }>("select external_id from local_completions where staff_slug = ?", slug);
  const ids = new Set(rows.map((row) => row.external_id));
  return tasks.map((task) => ({ ...task, localPreview: ids.has(task.id) }));
}

export async function buildSnapshot(viewer: StaffRow, forceNotion = false): Promise<Snapshot> {
  const fresh = sqlOne<StaffRow>("select * from staff where id = ?", viewer.id) ?? viewer;
  const today = localKey(new Date());
  const formPromise = loadClientForm().catch(() => emptyClientForm());
  const notionResult = await loadNotion(today, forceNotion);
  const usingNotion = notionResult.tasks !== null;
  const tasks = usingNotion ? withPreviews(notionResult.tasks ?? [], fresh.slug) : demoTasks(today);
  const mineDone = tasks.filter((task) => task.assignee === fresh.slug && task.status === "done").length;
  let awarded = fresh;
  if (mineDone >= 1) awarded = grantAchievement(awarded, "first-quest");
  if (mineDone >= 5) awarded = grantAchievement(awarded, "five-quests");
  const staffRows = sqlAll<StaffRow>("select * from staff order by display_name");
  const staff = staffRows.map((row) => toPublic(row.id === awarded.id ? awarded : row, awarded.slug));
  const me = staff.find((person) => person.id === awarded.id) ?? toPublic(awarded, awarded.slug);

  const projectRows = sqlAll<{ id: string; name: string; client: string; summary: string; colour: string }>("select * from projects");
  const projects = new Map<string, ProjectItem>();
  if (!usingNotion) {
    for (const project of projectRows) {
      projects.set(project.name, { ...project, done: 0, total: 0 });
    }
  }
  for (const task of tasks) {
    if (!projects.has(task.project)) {
      projects.set(task.project, {
        id: task.project.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: task.project,
        client: task.project,
        summary: usingNotion ? "Grouped from the linked Notion database." : "",
        colour: "#c47a86",
        done: 0,
        total: 0,
      });
    }
    const project = projects.get(task.project);
    if (!project) continue;
    project.total += 1;
    if (task.status === "done") project.done += 1;
  }

  const announcements = sqlAll<{ id: string; author_slug: string; body: string; created_at: string }>(
    "select * from announcements order by created_at desc limit 20",
  ).map((row) => ({
    id: row.id,
    authorSlug: (isSlug(row.author_slug) ? row.author_slug : "max") as StaffSlug,
    authorName: isSlug(row.author_slug) ? NAMES[row.author_slug] : row.author_slug,
    body: row.body,
    timeLabel: clockLabel(row.created_at),
  })) satisfies Announcement[];

  const doneCount = tasks.filter((task) => task.status === "done").length;
  const mapping = officeMapping();
  return {
    me,
    staff,
    tasks,
    projects: [...projects.values()],
    announcements,
    notion: {
      configured: notionConfigured(),
      mode: notionResult.mode,
      message: notionResult.stateMessage,
      mapping,
      cacheAgeSeconds: notionResult.age,
    },
    today,
    milestones: milestone(doneCount),
    clients: clientsByHealth(savedClientLights()).map(({ slug, name, light }) => ({ slug, name, light })),
    canEditLights: canEditClientLights(viewer.slug),
    form: await formPromise,
  };
}

export function presenceOf(viewerSlug: string) {
  return sqlAll<StaffRow>("select * from staff").map((row) => {
    const person = toPublic(row, viewerSlug);
    return {
      slug: person.slug,
      online: person.online,
      status: person.status,
      x: person.x,
      y: person.y,
      sitting: person.sitting,
      appearance: person.appearance,
      characterName: person.characterName,
    };
  });
}

export { statusLabel };
