import { CLIENT_DASHBOARDS, type ClientDashboard } from "@/lib/clients";

export type ClientLight = "green" | "amber" | "red";

const RED = new Set(["trendz-dashboard"]);
const AMBER = new Set([
  "auric-performance-dashboard",
  "captrad-dashboard",
  "new-reflexions-dashboard",
  "palace-nightclub-dashboard",
]);

export const CLIENT_LIGHT_LABEL: Record<ClientLight, string> = {
  green: "Good",
  amber: "Needs work",
  red: "Thinking of leaving",
};

const RANK: Record<ClientLight, number> = { red: 0, amber: 1, green: 2 };

export function isClientLight(value: unknown): value is ClientLight {
  return value === "green" || value === "amber" || value === "red";
}

export function canEditClientLights(slug: string) {
  return slug === "tash" || slug === "max";
}

export function clientLight(slug: string, overrides: Record<string, ClientLight> = {}): ClientLight {
  const saved = overrides[slug];
  if (isClientLight(saved)) return saved;
  if (RED.has(slug)) return "red";
  if (AMBER.has(slug)) return "amber";
  return "green";
}

export function clientsByHealth(overrides: Record<string, ClientLight> = {}): (ClientDashboard & { light: ClientLight })[] {
  return CLIENT_DASHBOARDS.map((client) => ({ ...client, light: clientLight(client.slug, overrides) })).sort(
    (a, b) => RANK[a.light] - RANK[b.light] || a.name.localeCompare(b.name, "en-GB"),
  );
}
