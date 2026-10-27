import { randomUUID } from "crypto";
import { DEFAULTS } from "@/pixel/game/options";
import type { PixelDatabase } from "@/pixel/lib/sql";
import type { Priority, StaffSlug, TaskKind, TaskStatus } from "@/pixel/types";

const SEED_VERSION = "1";

const WORK_EMAIL: Record<StaffSlug, string> = {
  max: "maximilian@mm-digi.co.uk",
  tash: "tash@mm-digi.co.uk",
  mariette: "mariette@mm-digi.co.uk",
  natasha: "natasha@mm-digi.co.uk",
};

const PEOPLE: {
  slug: StaffSlug;
  name: string;
  title: string;
  role: "admin" | "staff";
  accent: string;
}[] = [
  { slug: "max", name: "Max", title: "Founder & Director", role: "admin", accent: "#e25b6a" },
  { slug: "tash", name: "Tash", title: "Senior Web Specialist", role: "staff", accent: "#2f7c8a" },
  { slug: "mariette", name: "Mariette", title: "Marketing & Social Media Executive", role: "staff", accent: "#d4a054" },
  { slug: "natasha", name: "Natasha", title: "Campaign Manager", role: "staff", accent: "#6b5b95" },
];

type Template = {
  key: string;
  title: string;
  detail: string;
  project: string;
  assignee: StaffSlug;
  day: number;
  time: string | null;
  priority: Priority;
  status: TaskStatus;
  kind: TaskKind;
  xp: number;
};

const TASKS: Template[] = [
  { key: "max-strategy", title: "Strategy call prep", detail: "Notes for the Oriels conversation.", project: "Oriels Exeter", assignee: "max", day: 0, time: "09:00", priority: "high", status: "todo", kind: "task", xp: 40 },
  { key: "max-campaign", title: "Review the campaign plan", detail: "Read Natasha's Auric outline before the afternoon.", project: "Auric Performance", assignee: "max", day: 0, time: "11:00", priority: "normal", status: "todo", kind: "task", xp: 25 },
  { key: "max-checkin", title: "Team check-in", detail: "A short loop around the desks. No need to stay late.", project: "MM Digital", assignee: "max", day: 0, time: "15:00", priority: "normal", status: "todo", kind: "meeting", xp: 15 },
  { key: "max-homepage", title: "Approve the homepage notes", detail: "Internal copy notes, still open from yesterday.", project: "MM Digital", assignee: "max", day: -1, time: "16:00", priority: "high", status: "todo", kind: "task", xp: 40 },
  { key: "max-weekly", title: "Send the weekly note", detail: "Already sent in this demo week.", project: "MM Digital", assignee: "max", day: 0, time: "08:30", priority: "low", status: "done", kind: "task", xp: 15 },
  { key: "max-newbiz", title: "New business conversation", detail: "Hold the slot. The brief is not final.", project: "MM Digital", assignee: "max", day: 2, time: "10:00", priority: "normal", status: "todo", kind: "meeting", xp: 25 },
  { key: "tash-revisions", title: "Website revisions", detail: "Agency site adjustments on the local preview.", project: "MM Digital", assignee: "tash", day: 0, time: "09:00", priority: "high", status: "doing", kind: "task", xp: 40 },
  { key: "tash-client", title: "Client development work", detail: "Lost in Hound shop and content pages.", project: "Lost in Hound", assignee: "tash", day: 0, time: "10:30", priority: "normal", status: "todo", kind: "task", xp: 25 },
  { key: "tash-meeting", title: "Project meeting", detail: "Desk meeting. Bring the staging link.", project: "MM Digital", assignee: "tash", day: 0, time: "13:00", priority: "normal", status: "todo", kind: "meeting", xp: 15 },
  { key: "tash-deploy", title: "Test and deploy updates", detail: "Check the preview, then list what is ready.", project: "MM Digital", assignee: "tash", day: 0, time: "15:00", priority: "high", status: "todo", kind: "task", xp: 40 },
  { key: "tash-staging", title: "Check the staging link", detail: "Done earlier in the demo day.", project: "MM Digital", assignee: "tash", day: 0, time: "08:40", priority: "low", status: "done", kind: "task", xp: 15 },
  { key: "tash-landing", title: "Landing page pass", detail: "Oriels page structure, local only.", project: "Oriels Exeter", assignee: "tash", day: 3, time: "09:30", priority: "normal", status: "todo", kind: "task", xp: 25 },
  { key: "mariette-calendar", title: "Social calendar", detail: "Waldrons posts for the week ahead.", project: "Waldrons Patisserie", assignee: "mariette", day: 0, time: "09:30", priority: "normal", status: "todo", kind: "task", xp: 25 },
  { key: "mariette-drafts", title: "Content drafts", detail: "Oriels captions, ready for a read-through.", project: "Oriels Exeter", assignee: "mariette", day: 0, time: "11:30", priority: "normal", status: "doing", kind: "task", xp: 25 },
  { key: "mariette-replies", title: "Community replies", detail: "Lost in Hound comments from overnight.", project: "Lost in Hound", assignee: "mariette", day: 0, time: "14:00", priority: "low", status: "todo", kind: "task", xp: 15 },
  { key: "mariette-captions", title: "Caption bank", detail: "A first batch is already filed.", project: "Lost in Hound", assignee: "mariette", day: 0, time: "08:50", priority: "low", status: "done", kind: "task", xp: 15 },
  { key: "mariette-shoot", title: "Shoot plan", detail: "Auric stills list for later in the week.", project: "Auric Performance", assignee: "mariette", day: 1, time: "10:00", priority: "high", status: "todo", kind: "task", xp: 40 },
  { key: "mariette-community", title: "Community hour", detail: "Waldrons replies, one sitting, then stop.", project: "Waldrons Patisserie", assignee: "mariette", day: 4, time: "15:00", priority: "low", status: "todo", kind: "task", xp: 15 },
  { key: "natasha-schedule", title: "Campaign schedule", detail: "Auric dates for the next fortnight.", project: "Auric Performance", assignee: "natasha", day: 0, time: "09:00", priority: "high", status: "todo", kind: "task", xp: 40 },
  { key: "natasha-deadlines", title: "Deadline review", detail: "A short meeting. Bring the open dates, not a late night.", project: "MM Digital", assignee: "natasha", day: 0, time: "12:00", priority: "urgent", status: "todo", kind: "meeting", xp: 20 },
  { key: "natasha-ads", title: "Confirm the ad dates", detail: "Auric dates that slipped from yesterday.", project: "Auric Performance", assignee: "natasha", day: -1, time: "11:00", priority: "urgent", status: "todo", kind: "task", xp: 50 },
  { key: "natasha-budget", title: "Budget check", detail: "Auric figures reconciled in the demo.", project: "Auric Performance", assignee: "natasha", day: 0, time: "08:20", priority: "normal", status: "done", kind: "task", xp: 25 },
  { key: "natasha-report", title: "Reporting pack", detail: "Waldrons monthly pack, draft only.", project: "Waldrons Patisserie", assignee: "natasha", day: 2, time: "14:00", priority: "normal", status: "todo", kind: "task", xp: 25 },
  { key: "natasha-outline", title: "Next month outline", detail: "A first pass, not a promise.", project: "MM Digital", assignee: "natasha", day: 5, time: "09:30", priority: "normal", status: "todo", kind: "task", xp: 25 },
];

const PROJECTS = [
  { id: "oriels", name: "Oriels Exeter", client: "Oriels", summary: "Website, social, and the booking journey.", colour: "#e25b6a" },
  { id: "hound", name: "Lost in Hound", client: "Lost in Hound", summary: "Content and the shop channels.", colour: "#c47a4a" },
  { id: "auric", name: "Auric Performance", client: "Auric Performance", summary: "Campaign planning and reporting.", colour: "#d4a054" },
  { id: "waldrons", name: "Waldrons Patisserie", client: "Waldrons", summary: "Social calendar and the monthly pack.", colour: "#7d9a78" },
  { id: "internal", name: "MM Digital", client: "MM Digital", summary: "The agency's own site and internal work.", colour: "#ff808b" },
];

function setting(database: PixelDatabase, key: string) {
  const row = database.prepare("select value from settings where key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function seed(database: PixelDatabase) {
  const now = new Date().toISOString();
  for (const person of PEOPLE) {
    const existing = database.prepare("select id, email from staff where slug = ?").get(person.slug) as
      | { id: string; email: string }
      | undefined;
    if (existing) {
      if (String(existing.email).endsWith("@pixel-hq.local")) {
        database.prepare("update staff set email = ? where slug = ?").run(WORK_EMAIL[person.slug], person.slug);
      }
      continue;
    }
    database
      .prepare(
        `insert into staff (
          id, slug, email, display_name, title, role, password_hash, accent, character_name,
          appearance, creator_done, xp, status, notes, gamification, sound, calm, plain_mode,
          achievements, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'working', '', 1, 0, 0, 0, '[]', ?)`,
      )
      .run(
        randomUUID(),
        person.slug,
        WORK_EMAIL[person.slug],
        person.name,
        person.title,
        person.role,
        "website",
        person.accent,
        person.name,
        JSON.stringify(DEFAULTS[person.slug]),
        now,
      );
  }

  if (setting(database, "seed_version") === SEED_VERSION) {
    const announcements = database.prepare("select count(*) as n from announcements").get() as { n: number };
    if (Number(announcements.n) === 0 && setting(database, "announcements_seeded") !== "1") {
      insertAnnouncements(database, now);
    }
    return;
  }

  const doneRows = database.prepare("select demo_key from tasks where status = 'done' and demo_key is not null").all() as { demo_key: string }[];
  const done = new Set(doneRows.map((row) => row.demo_key));
  database.prepare("delete from tasks where source = 'demo'").run();
  database.prepare("delete from projects where demo = 1").run();

  for (const project of PROJECTS) {
    database
      .prepare("insert into projects (id, name, client, summary, colour, demo) values (?, ?, ?, ?, ?, 1)")
      .run(project.id, project.name, project.client, project.summary, project.colour);
  }

  for (const task of TASKS) {
    database
      .prepare(
        `insert into tasks (
          id, demo_key, title, detail, project_name, assignee_slug, day_offset, time_of_day,
          priority, status, kind, xp_reward, source
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo')`,
      )
      .run(
        randomUUID(),
        task.key,
        task.title,
        task.detail,
        task.project,
        task.assignee,
        task.day,
        task.time,
        task.priority,
        done.has(task.key) ? "done" : task.status,
        task.kind,
        task.xp,
      );
  }

  if (setting(database, "announcements_seeded") !== "1") insertAnnouncements(database, now);
  database.prepare("insert into settings (key, value) values ('seed_version', ?) on conflict(key) do update set value = excluded.value").run(SEED_VERSION);
}

function insertAnnouncements(database: PixelDatabase, now: string) {
  const rows = [
    ["max", "The kettle is on. This board is in demo mode until Notion is linked. Quests are optional, and Frank is in charge of breaks."],
    ["tash", "Client dashboards stay separate from this office."],
  ];
  for (const [slug, body] of rows) {
    database.prepare("insert into announcements (id, author_slug, body, created_at) values (?, ?, ?, ?)").run(randomUUID(), slug, body, now);
  }
  database.prepare("insert into settings (key, value) values ('announcements_seeded', '1') on conflict(key) do update set value = '1'").run();
}
