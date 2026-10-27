import { isClientLight, type ClientLight } from "@/lib/client-health";
import { DASHBOARD_SLUGS } from "@/lib/clients";
import { sqlOne, sqlRun } from "@/pixel/lib/db";

export function savedClientLights(): Record<string, ClientLight> {
  const row = sqlOne<{ value: string }>("select value from settings where key = 'client_lights'");
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const saved: Record<string, ClientLight> = {};
    for (const [slug, light] of Object.entries(parsed)) {
      if (DASHBOARD_SLUGS.has(slug) && isClientLight(light)) saved[slug] = light;
    }
    return saved;
  } catch {
    return {};
  }
}

export function saveClientLight(slug: string, light: ClientLight) {
  const saved = savedClientLights();
  saved[slug] = light;
  sqlRun(
    "insert into settings (key, value) values ('client_lights', ?) on conflict(key) do update set value = excluded.value",
    JSON.stringify(saved),
  );
}