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

export function clientLight(slug: string): ClientLight {
  if (RED.has(slug)) return "red";
  if (AMBER.has(slug)) return "amber";
  return "green";
}

export function clientsByHealth(): (ClientDashboard & { light: ClientLight })[] {
  return CLIENT_DASHBOARDS.map((client) => ({ ...client, light: clientLight(client.slug) })).sort(
    (a, b) => RANK[a.light] - RANK[b.light] || a.name.localeCompare(b.name, "en-GB"),
  );
}
