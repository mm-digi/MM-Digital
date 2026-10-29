import { randomUUID } from "crypto";
import { canEditClientLights, isClientLight } from "@/lib/client-health";
import { DASHBOARD_SLUGS, getDashboard } from "@/lib/clients";
import { cleanAppearance, unlockNamesBetween } from "@/pixel/game/options";
import { sqlOne, sqlRun, type StaffRow, type TaskRow } from "@/pixel/lib/db";
import { localKey } from "@/pixel/lib/format";
import { saveClientLight } from "@/pixel/lib/lights";
import { cleanMapping, fetchNotionSchema, loadNotion, markNotionDone, notionPageId, notionXp, saveMapping } from "@/pixel/lib/notion";
import { buildSnapshot } from "@/pixel/lib/snapshot";
import { ACHIEVEMENTS, levelProgress } from "@/pixel/lib/xp";
import type { ActionBody, ActionResult, Snapshot, StaffSlug, Status } from "@/pixel/types";

const STATUSES: Status[] = ["working", "meeting", "break", "away", "available"];
const fail = (status: number, error: string): ActionResult => ({ ok: false, status, error });

function addAchievement(row: StaffRow, id: string) {
  let list: string[] = [];
  try {
    const parsed = JSON.parse(row.achievements) as unknown;
    if (Array.isArray(parsed)) list = parsed.filter((item) => typeof item === "string");
  } catch {
    list = [];
  }
  if (list.includes(id)) return list;
  list.push(id);
  sqlRun("update staff set achievements = ? where id = ?", JSON.stringify(list), row.id);
  return list;
}

function fresh(id: string) {
  const row = sqlOne<StaffRow>("select * from staff where id = ?", id);
  if (!row) throw new Error("Staff record missing.");
  return row;
}

// Notion pages that have already paid out XP, per person, so a task ticked,
// reopened and ticked again in Notion only counts once.
function claimNotionXp(slug: string, pageId: string) {
  const key = `notion_xp:${slug}`;
  const row = sqlOne<{ value: string }>("select value from settings where key = ?", key);
  let claimed: string[] = [];
  try {
    const parsed = JSON.parse(row?.value || "[]") as unknown;
    if (Array.isArray(parsed)) claimed = parsed.filter((item) => typeof item === "string");
  } catch {
    claimed = [];
  }
  if (claimed.includes(pageId)) return false;
  claimed.push(pageId);
  sqlRun(
    "insert into settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
    key,
    JSON.stringify(claimed),
  );
  return true;
}

function questDoneResult(snapshot: Snapshot, reward: number, beforeLevel: number, plain: string): ActionResult {
  if (!snapshot.me.gamification || !reward) return { ok: true, snapshot, toast: plain };
  const unlocked = unlockNamesBetween(beforeLevel, snapshot.me.level);
  const extra = unlocked.length ? ` Unlocked: ${unlocked.join(", ")}.` : "";
  const levelNote = snapshot.me.level > beforeLevel ? ` Level ${snapshot.me.level}.` : "";
  return { ok: true, snapshot, celebrate: true, toast: `${plain} ${reward} XP.${levelNote}${extra}` };
}

export async function handleAction(me: StaffRow, body: ActionBody | null): Promise<ActionResult> {
  if (!body || typeof body !== "object" || !("type" in body)) return fail(400, "Unrecognised request.");

  if (body.type === "avatar") {
    const current = fresh(me.id);
    const level = levelProgress(current.xp).level;
    const cleaned = cleanAppearance(body.appearance, level, true);
    if (cleaned.error) return fail(400, cleaned.error);
    const name = String(body.characterName || "").trim().slice(0, 18);
    if (!name) return fail(400, "Add a character name.");
    sqlRun("update staff set appearance = ?, character_name = ?, creator_done = 1 where id = ?", JSON.stringify(cleaned.appearance), name, me.id);
    addAchievement(fresh(me.id), "look");
    const snapshot = await buildSnapshot(fresh(me.id));
    return { ok: true, snapshot, toast: "Look saved for the office." };
  }

  if (body.type === "status") {
    if (!STATUSES.includes(body.status)) return fail(400, "Unknown status.");
    sqlRun("update staff set status = ? where id = ?", body.status, me.id);
    if (body.status === "break") addAchievement(fresh(me.id), "coffee");
    const snapshot = await buildSnapshot(fresh(me.id));
    const toast = body.status === "break" ? "Break noted. Nothing here rewards skipping it." : "Status updated.";
    return { ok: true, snapshot, toast };
  }

  if (body.type === "notes") {
    const notes = String(body.notes ?? "").slice(0, 2000);
    sqlRun("update staff set notes = ? where id = ?", notes, me.id);
    const snapshot = await buildSnapshot(fresh(me.id));
    return { ok: true, snapshot, toast: "Notes saved on your desk." };
  }

  if (body.type === "preferences") {
    const current = fresh(me.id);
    const flag = (value: boolean | undefined, existing: number) => (value === undefined ? existing : value ? 1 : 0);
    sqlRun(
      "update staff set gamification = ?, sound = ?, calm = ?, plain_mode = ? where id = ?",
      flag(body.gamification, current.gamification),
      flag(body.sound, current.sound),
      flag(body.calm, current.calm),
      flag(body.plainMode, current.plain_mode),
      me.id,
    );
    const snapshot = await buildSnapshot(fresh(me.id));
    return { ok: true, snapshot };
  }

  if (body.type === "announce") {
    const text = String(body.body ?? "").trim().slice(0, 280);
    if (!text) return fail(400, "Write a short announcement first.");
    sqlRun("insert into announcements (id, author_slug, body, created_at) values (?, ?, ?, ?)", randomUUID(), me.slug, text, new Date().toISOString());
    const snapshot = await buildSnapshot(fresh(me.id));
    return { ok: true, snapshot, toast: "Pinned to the noticeboard." };
  }

  if (body.type === "deleteAnnounce") {
    const row = sqlOne<{ id: string; author_slug: string }>("select id, author_slug from announcements where id = ?", body.id);
    if (!row) return fail(404, "That note is already gone.");
    if (row.author_slug !== me.slug && me.role !== "admin") return fail(403, "You can remove your own notes.");
    sqlRun("delete from announcements where id = ?", body.id);
    const snapshot = await buildSnapshot(fresh(me.id));
    return { ok: true, snapshot };
  }

  if (body.type === "frank") {
    addAchievement(fresh(me.id), "frank");
    const snapshot = await buildSnapshot(fresh(me.id));
    return { ok: true, snapshot };
  }

  if (body.type === "complete") {
    if (body.taskId.startsWith("notion:")) {
      const pageId = notionPageId(body.taskId);
      if (!pageId) return fail(400, "That quest is not linked to Notion.");
      const loaded = await loadNotion(localKey(new Date()));
      const notionTask = loaded.tasks?.find((task) => task.id === body.taskId);
      if (!notionTask) return fail(404, "That Notion task is not in the current copy.");
      if (notionTask.assignee && notionTask.assignee !== me.slug) return fail(403, "This quest belongs to someone else.");
      if (notionTask.status === "done") {
        const snapshot = await buildSnapshot(fresh(me.id), true);
        return { ok: true, snapshot, toast: "Already marked done in Notion." };
      }
      try {
        await markNotionDone(pageId);
      } catch (error) {
        return fail(502, error instanceof Error ? error.message : "Notion could not mark that quest done.");
      }
      const beforeLevel = levelProgress(fresh(me.id).xp).level;
      const reward = claimNotionXp(me.slug, pageId) ? notionXp(notionTask.priority) : 0;
      if (reward) sqlRun("update staff set xp = xp + ? where id = ?", reward, me.id);
      const snapshot = await buildSnapshot(fresh(me.id), true);
      return questDoneResult(snapshot, reward, beforeLevel, "Marked done in Notion.");
    }
    const task = sqlOne<TaskRow>("select * from tasks where id = ?", body.taskId);
    if (!task || task.source !== "demo") return fail(404, "That quest is not on the demo board.");
    if (task.assignee_slug !== me.slug) return fail(403, "This quest belongs to someone else.");
    if (task.status === "done") {
      const snapshot = await buildSnapshot(fresh(me.id));
      return { ok: true, snapshot, toast: "Already marked done." };
    }
    const before = levelProgress(me.xp);
    sqlRun("update tasks set status = 'done', completed_at = ? where id = ?", new Date().toISOString(), task.id);
    sqlRun("update staff set xp = xp + ? where id = ?", task.xp_reward, me.id);
    const afterRow = fresh(me.id);
    const doneCount = sqlOne<{ n: number }>("select count(*) as n from tasks where source = 'demo' and assignee_slug = ? and status = 'done'", me.slug);
    addAchievement(afterRow, "first-quest");
    if (Number(doneCount?.n ?? 0) >= 5) addAchievement(fresh(me.id), "five-quests");
    const snapshot = await buildSnapshot(fresh(me.id));
    return questDoneResult(snapshot, task.xp_reward, before.level, snapshot.me.gamification ? "Marked done." : "Marked done on your list.");
  }

  if (body.type === "notionSchema") {
    if (me.role !== "admin") return fail(403, "Only an administrator can link Notion.");
    if (!process.env.NOTION_TOKEN?.trim()) return fail(400, "Add NOTION_TOKEN on the server, then reload the office.");
    const databaseId = String(body.databaseId || "").trim();
    if (!databaseId) return fail(400, "Add the Notion database ID first.");
    try {
      const schema = await fetchNotionSchema(databaseId);
      return { ok: true, schema };
    } catch (error) {
      return fail(502, error instanceof Error ? error.message : "Could not read that Notion database.");
    }
  }

  if (body.type === "notionSave") {
    if (me.role !== "admin") return fail(403, "Only an administrator can link Notion.");
    const mapping = cleanMapping(body.mapping);
    if (!mapping.tasksDatabaseId || !mapping.titleProp || !mapping.dateProp) {
      return fail(400, "Map the database, the title, and the date before saving.");
    }
    saveMapping(mapping);
    const snapshot = await buildSnapshot(fresh(me.id), true);
    return { ok: true, snapshot, toast: snapshot.notion.mode === "demo" ? "Mapping saved. Demo tasks are still showing." : "Notion mapping saved." };
  }

  if (body.type === "clientLight") {
    if (!canEditClientLights(me.slug)) return fail(403, "Only Tash and Max can change the lights.");
    const slug = String(body.slug || "").trim();
    if (!DASHBOARD_SLUGS.has(slug) || !isClientLight(body.light)) return fail(400, "That client light could not be saved.");
    saveClientLight(slug, body.light);
    const snapshot = await buildSnapshot(fresh(me.id));
    const name = getDashboard(slug)?.name || "Client";
    return { ok: true, snapshot, toast: `${name} updated.` };
  }

  if (body.type === "notionRefresh") {
    // buildSnapshot with force reloads Notion itself, so this is one round of Notion calls.
    const snapshot = await buildSnapshot(fresh(me.id), true);
    return { ok: true, snapshot, toast: snapshot.notion.message || "Tasks refreshed." };
  }

  return fail(400, "Unrecognised request.");
}

export const achievementCopy = ACHIEVEMENTS;
export type { StaffSlug };
