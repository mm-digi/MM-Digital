import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { seed } from "@/pixel/lib/seed";
import { createPixelDb, emptyTables, normaliseTables, type Cell, type Row, type SqlParam, type Tables } from "@/pixel/lib/sql";

const BUCKET = "pixel-hq";
const STATE = "state.json";
const LOCK = "lock.json";
const LOCK_MS = 45_000;
const HEARTBEAT_MS = 5_000;

type Ctx = { tables: Tables; dirty: boolean };
type LockFile = { token: string; at: string };

const store = new AsyncLocalStorage<Ctx>();
let bucketReady = false;

export type { SqlParam };

export type StaffRow = {
  id: string;
  slug: string;
  email: string;
  display_name: string;
  title: string;
  role: "admin" | "staff";
  password_hash: string;
  accent: string;
  character_name: string;
  appearance: string;
  creator_done: number;
  xp: number;
  status: string;
  notes: string;
  gamification: number;
  sound: number;
  calm: number;
  plain_mode: number;
  achievements: string;
  pos_x: number | null;
  pos_y: number | null;
  last_seen: string | null;
  created_at: string;
};

export type TaskRow = {
  id: string;
  demo_key: string | null;
  title: string;
  detail: string;
  project_name: string;
  assignee_slug: string | null;
  day_offset: number | null;
  time_of_day: string | null;
  priority: string;
  status: string;
  kind: string;
  xp_reward: number;
  source: string;
  completed_at: string | null;
};

export function db() {
  const ctx = store.getStore();
  if (!ctx) throw new Error("Pixel office store is not open.");
  return createPixelDb(ctx.tables, () => {
    ctx.dirty = true;
  });
}

export function sqlOne<T>(sql: string, ...params: SqlParam[]) {
  return db().prepare(sql).get(...params) as T | undefined;
}

export function sqlAll<T>(sql: string, ...params: SqlParam[]) {
  return db().prepare(sql).all(...params) as T[];
}

export function sqlRun(sql: string, ...params: SqlParam[]) {
  return db().prepare(sql).run(...params);
}

// The office state is one private JSON file. Vercel disk is ephemeral, and this
// must not create tables in the client database. A lock file stops one person's
// presence update from overwriting someone else's save.
export async function withPixel<T>(fn: () => Promise<T>): Promise<T> {
  const admin = createAdminClient();
  await ensureBucket(admin);
  const token = await acquireLock(admin);
  // Opening the office matters more than winning the save. A missed save can
  // retry on the next visit. A thrown lock error is the page that would not open.
  if (!token) return runPixel(admin, fn);
  const beat = startHeartbeat(admin, token);
  try {
    const tables = await loadState(admin);
    const ctx: Ctx = { tables, dirty: false };
    try {
      return await store.run(ctx, async () => {
        seed(db());
        return await fn();
      });
    } finally {
      await beat.stop();
      if (ctx.dirty) {
        const holder = await readLock(admin);
        if (holder?.token === token) await saveState(admin, ctx.tables);
      }
    }
  } finally {
    await beat.stop();
    await releaseLock(admin, token);
  }
}

async function runPixel<T>(admin: StorageClient, fn: () => Promise<T>) {
  const tables = await loadState(admin);
  const ctx: Ctx = { tables, dirty: false };
  return store.run(ctx, async () => {
    seed(db());
    return await fn();
  });
}

function startHeartbeat(admin: StorageClient, token: string) {
  let stopped = false;
  let pending: Promise<void> | null = null;
  const tick = () => {
    if (stopped || pending) return;
    pending = refreshOwnLock(admin, token, () => stopped).finally(() => {
      pending = null;
    });
  };
  const timer = setInterval(tick, HEARTBEAT_MS);
  if (typeof timer === "object" && timer !== null && "unref" in timer) timer.unref();
  return {
    stop: async () => {
      stopped = true;
      clearInterval(timer);
      if (pending) await pending;
    },
  };
}

async function refreshOwnLock(admin: StorageClient, token: string, stopped: () => boolean) {
  try {
    const current = await readLock(admin);
    if (stopped() || !current || current.token !== token) return;
    const body = Buffer.from(JSON.stringify({ token, at: new Date().toISOString() } satisfies LockFile));
    if (stopped()) return;
    await admin.storage.from(BUCKET).upload(LOCK, body, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  } catch {
    // A missed beat is safe. The lock still expires, and the save checks the token.
  }
}

type StorageError = { message?: string; statusCode?: string | number } | null;
type StorageClient = ReturnType<typeof createAdminClient>;

async function ensureBucket(admin: StorageClient) {
  if (bucketReady) return;
  const listed = await admin.storage.listBuckets();
  if (listed.error) failStore("list", listed.error);
  if (!listed.data?.some((bucket) => bucket.name === BUCKET)) {
    const created = await admin.storage.createBucket(BUCKET, { public: false });
    if (created.error && !isConflict(created.error)) failStore("create", created.error);
  }
  bucketReady = true;
}

async function acquireLock(admin: StorageClient) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const token = randomUUID();
    const body = Buffer.from(JSON.stringify({ token, at: new Date().toISOString() } satisfies LockFile));
    const uploaded = await admin.storage.from(BUCKET).upload(LOCK, body, {
      upsert: false,
      contentType: "application/json",
      cacheControl: "0",
    });
    if (!uploaded.error) return token;
    if (!isConflict(uploaded.error)) failStore("lock", uploaded.error);
    const current = await readLock(admin);
    const seenAt = current ? Date.parse(current.at) : Number.NaN;
    if (current && Number.isFinite(seenAt) && Date.now() - seenAt > LOCK_MS) {
      await admin.storage.from(BUCKET).remove([LOCK]);
      continue;
    }
    await wait(120 + Math.floor(Math.random() * 180));
  }
  return null;
}

async function releaseLock(admin: StorageClient, token: string) {
  const current = await readLock(admin);
  if (current?.token === token) await admin.storage.from(BUCKET).remove([LOCK]);
}

async function readLock(admin: StorageClient): Promise<LockFile | null> {
  const downloaded = await admin.storage.from(BUCKET).download(LOCK);
  if (downloaded.error || !downloaded.data) {
    if (downloaded.error && !isMissing(downloaded.error)) failStore("lock-read", downloaded.error);
    return null;
  }
  const parsed = JSON.parse(await downloaded.data.text()) as Partial<LockFile>;
  if (!parsed.token || !parsed.at) return null;
  return { token: parsed.token, at: parsed.at };
}

async function loadState(admin: StorageClient) {
  const downloaded = await admin.storage.from(BUCKET).download(STATE);
  if (downloaded.error || !downloaded.data) {
    if (downloaded.error && !isMissing(downloaded.error)) failStore("read", downloaded.error);
    return emptyTables();
  }
  const parsed = JSON.parse(await downloaded.data.text()) as { version?: number; tables?: unknown };
  if (parsed.version !== 1 || !parsed.tables) throw new Error("Pixel office data was not readable.");
  return normaliseTables(parsed.tables);
}

async function saveState(admin: StorageClient, tables: Tables) {
  const body = Buffer.from(JSON.stringify({ version: 1, tables }));
  const uploaded = await admin.storage.from(BUCKET).upload(STATE, body, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (uploaded.error) failStore("save", uploaded.error);
}

function isConflict(error: StorageError) {
  const status = String(error?.statusCode ?? "");
  return status === "409" || /already exists|duplicate/i.test(error?.message || "");
}

function isMissing(error: StorageError) {
  const status = String(error?.statusCode ?? "");
  return status === "404" || /not found|does not exist/i.test(error?.message || "");
}

function failStore(action: string, error: { message?: string }) {
  console.error(`pixel store ${action}: ${error.message || "unknown"}`);
  throw new Error("Could not open the pixel office.");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { Cell, Row };
