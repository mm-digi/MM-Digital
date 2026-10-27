import { randomUUID } from "crypto";
import { canEditClientLights, isClientLight } from "@/lib/client-health";
import { DASHBOARD_SLUGS, getDashboard } from "@/lib/clients";
import { ROOM_H, ROOM_W } from "@/pixel/game/layout";
import { cleanAppearance, unlockNamesBetween } from "@/pixel/game/options";
import { sqlOne, sqlRun, type StaffRow, type TaskRow } from "@/pixel/lib/db";
import { saveClientLight } from "@/pixel/lib/lights";
import { cleanMapping, fetchNotionSchema, loadNotion, saveMapping } from "@/pixel/lib/notion";
import { buildSnapshot, presenceOf } from "@/pixel/lib/snapshot";
import { ACHIEVEMENTS, levelProgress } from "@/pixel/lib/xp";
import type { ActionBody, ActionResult, StaffSlug, Status } from "@/pixel/types";

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

export async function handleAction(me: StaffRow, body: ActionBody | null): Promise<ActionResult> {
  if (!body || typeof body !== "object" || !("type" in body)) return fail(400, "Unrecognised request.");

  if (body.type === "presence") {
    const now = new Date().toISOString();
    if (typeof body.x === "number" && typeof body.y === "number" && Number.isFinite(body.x) && Number.isFinite(body.y)) {
      const x = Math.max(0, Math.min(ROOM_W, body.x));
      const y = Math.max(0, Math.min(ROOM_H, body.y));
      sqlRun("update staff set pos_x = ?, pos_y = ?, last_seen = ? where id = ?", x, y, now, me.id);
    } else {
      sqlRun("update staff set last_seen = ? where id = ?", now, me.id);
    }
    return { ok: true, staff: presenceOf(me.slug) };
  }

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
    sqlRun("update staff set status = ?, last_seen = ? where id = ?", body.status, new Date().toISOString(), me.id);
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
      const today = new Date();
      const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const loaded = await loadNotion(key);
      const notionTask = loaded.tasks?.find((task) => task.id === body.taskId);
      if (!notionTask) return fail(404, "That Notion task is not in the current copy.");
      if (notionTask.assignee && notionTask.assignee !== me.slug) return fail(403, "This quest belongs to someone else.");
      sqlRun(
        "insert into local_completions (staff_slug, external_id, created_at) values (?, ?, ?) on conflict(staff_slug, external_id) do nothing",
        me.slug,
        body.taskId,
        new Date().toISOString(),
      );
      const snapshot = await buildSnapshot(fresh(me.id));
      return {
        ok: true,
        snapshot,
        toast: "Saved as a local preview. Notion was not changed.",
      };
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
    const after = levelProgress(afterRow.xp);
    const doneCount = sqlOne<{ n: number }>("select count(*) as n from tasks where source = 'demo' and assignee_slug = ? and status = 'done'", me.slug);
    addAchievement(afterRow, "first-quest");
    if (Number(doneCount?.n ?? 0) >= 5) addAchievement(fresh(me.id), "five-quests");
    const unlocked = unlockNamesBetween(before.level, after.level);
    const snapshot = await buildSnapshot(fresh(me.id));
    if (!snapshot.me.gamification) {
      return { ok: true, snapshot, toast: "Marked done on your list." };
    }
    const extra = unlocked.length ? ` Unlocked: ${unlocked.join(", ")}.` : "";
    const levelNote = after.level > before.level ? ` Level ${after.level}.` : "";
    return {
      ok: true,
      snapshot,
      celebrate: true,
      toast: `Marked done. ${task.xp_reward} XP.${levelNote}${extra}`,
    };
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
    await loadNotion(new Date().toISOString().slice(0, 10), true).catch(() => null);
    const snapshot = await buildSnapshot(fresh(me.id), true);
    return { ok: true, snapshot, toast: snapshot.notion.message || "Tasks refreshed." };
  }

  return fail(400, "Unrecognised request.");
}

export const achievementCopy = ACHIEVEMENTS;
export type { StaffSlug };
