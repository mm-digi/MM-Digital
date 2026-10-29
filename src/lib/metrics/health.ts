import { CLIENT_DASHBOARDS } from "@/lib/clients";
import { escapeHtml, sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

// Checks every current client's dashboard figures after the morning sync and
// emails the team when something stops updating. Only clients listed in
// CLIENT_DASHBOARDS are checked, so former clients never trigger an alert.
//
// To avoid an email every day about the same thing, a problem is emailed on the
// day it first appears, and anything still broken is listed again each Monday.

export const ALERT_TO = ["tash@mm-digi.co.uk", "info@mm-digi.co.uk"];

// New clients whose accounts aren't connected yet. Remove a slug once their
// figures start coming in, so they're watched like everyone else.
const NOT_SET_UP = new Set(["tors-vodka-dashboard"]);

// Figures from 3+ days ago means two whole days have gone missing.
const STALE_AFTER_DAYS = 3;
const LOOKBACK_DAYS = 45;
// Ad accounts only report on days ads run, and LinkedIn only on days with
// activity, so a gap there is normal and not watched.
const WATCHED_SOURCES = ["ga4", "facebook", "instagram"];
const SITE = "https://mm-digi.co.uk";

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website (Google Analytics)",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  all: "All figures",
};

export type DataProblem = {
  slug: string;
  name: string;
  source: string;
  lastDate: string | null;
  daysAgo: number | null;
  isNew: boolean;
};

export type HealthReport = {
  today: string;
  problems: DataProblem[];
  healthy: number;
  syncErrors: string[];
};

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

async function latestDates(clientIds: string[], since: string) {
  const supabase = createAdminClient();
  const latest = new Map<string, string>();
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("client_id, source, date")
      .in("client_id", clientIds)
      .gte("date", since)
      .order("date", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    for (const row of data || []) {
      const key = `${row.client_id}|${row.source}`;
      const date = String(row.date);
      if (!latest.has(key) || date > latest.get(key)!) latest.set(key, date);
    }
    if (!data || data.length < page) break;
  }
  return latest;
}

// Same spellings findClient tries for a dashboard slug, without a query each.
function matchClient<T extends { slug: string }>(rows: T[], slug: string) {
  const candidates = [slug, slug.replace(/-dashboard$/, ""), slug.replace(/-2$/, "")];
  for (const candidate of candidates) {
    const found = rows.find((row) => row.slug === candidate);
    if (found) return found;
  }
  const loose = rows.filter((row) => row.slug.includes(slug.replace(/-dashboard$/, "")));
  return loose.length === 1 ? loose[0] : null;
}

export async function checkDataHealth(syncErrors: string[] = [], now = new Date()): Promise<HealthReport> {
  const today = iso(now);
  const since = iso(new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000));
  // One query for every client, matched the same way the dashboards are. Looking
  // them up one by one opens too many database connections at once.
  const { data: rows, error } = await createAdminClient().from("clients").select("id, name, slug");
  if (error) throw error;
  const clients = CLIENT_DASHBOARDS.filter((dashboard) => !NOT_SET_UP.has(dashboard.slug)).map((dashboard) => ({
    dashboard,
    client: matchClient(rows || [], dashboard.slug),
  }));
  const ids = clients.flatMap(({ client }) => (client ? [client.id] : []));
  const latest = ids.length ? await latestDates(ids, since) : new Map<string, string>();

  const problems: DataProblem[] = [];
  let healthy = 0;
  for (const { dashboard, client } of clients) {
    const sources = client
      ? WATCHED_SOURCES.filter((source) => latest.has(`${client.id}|${source}`))
      : [];
    const anyFigures = client ? [...latest.keys()].some((key) => key.startsWith(`${client.id}|`)) : false;
    if (!anyFigures) {
      problems.push({ slug: dashboard.slug, name: dashboard.name, source: "all", lastDate: null, daysAgo: null, isNew: false });
      continue;
    }
    let ok = true;
    for (const source of sources) {
      const lastDate = latest.get(`${client!.id}|${source}`)!;
      const daysAgo = daysBetween(lastDate, today);
      if (daysAgo >= STALE_AFTER_DAYS) {
        ok = false;
        problems.push({ slug: dashboard.slug, name: dashboard.name, source, lastDate, daysAgo, isNew: daysAgo === STALE_AFTER_DAYS });
      }
    }
    if (ok) healthy += 1;
  }
  problems.sort((a, b) => a.name.localeCompare(b.name, "en-GB") || a.source.localeCompare(b.source));
  return { today, problems, healthy, syncErrors };
}

function prettyDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function describe(problem: DataProblem) {
  if (!problem.lastDate) return `No figures in the last ${LOOKBACK_DAYS} days`;
  return `Last figures ${prettyDate(problem.lastDate)} (${problem.daysAgo} days ago)`;
}

function problemRows(list: DataProblem[]) {
  return list
    .map(
      (problem) => `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top"><a href="${SITE}/${escapeHtml(problem.slug)}/" style="color:#111;font-weight:bold;text-decoration:none">${escapeHtml(problem.name)}</a></td>
<td style="padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top">${escapeHtml(SOURCE_LABELS[problem.source] || problem.source)}</td>
<td style="padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top;color:#555">${escapeHtml(describe(problem))}</td>
</tr>`,
    )
    .join("\n");
}

function section(title: string, intro: string, body: string) {
  return `<h3 style="margin:28px 0 6px;font-size:16px;color:#111">${escapeHtml(title)}</h3>
<p style="margin:0 0 10px;color:#555;font-size:14px">${escapeHtml(intro)}</p>
${body}`;
}

function table(list: DataProblem[]) {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
<tr><th align="left" style="padding:8px 12px;border-bottom:2px solid #d9536a;color:#d9536a">Client</th><th align="left" style="padding:8px 12px;border-bottom:2px solid #d9536a;color:#d9536a">Source</th><th align="left" style="padding:8px 12px;border-bottom:2px solid #d9536a;color:#d9536a">Problem</th></tr>
${problemRows(list)}
</table>`;
}

export function renderHealthEmail(report: HealthReport, mode: "alert" | "weekly" | "test") {
  const fresh = report.problems.filter((problem) => problem.isNew);
  const ongoing = report.problems.filter((problem) => !problem.isNew);
  const count = report.problems.length + report.syncErrors.length;
  const subject =
    mode === "test"
      ? "[Test] Client data check"
      : mode === "weekly"
        ? `Weekly data check: ${count} problem${count === 1 ? "" : "s"} still open`
        : `⚠ Client data problem${fresh.length + report.syncErrors.length === 1 ? "" : "s"} on ${prettyDate(report.today)}`;

  const parts: string[] = [];
  if (mode === "test") {
    parts.push(
      `<p style="margin:0 0 16px;padding:10px 12px;background:#fff1f3;border-left:4px solid #d9536a;font-size:14px">This is a test. Real alerts go to ${ALERT_TO.map(escapeHtml).join(" and ")} on the morning a client's figures stop updating, with a reminder each Monday for anything still broken.</p>`,
    );
  }
  parts.push(`<h2 style="margin:0 0 8px;font-size:20px;color:#111">Client data check · ${escapeHtml(prettyDate(report.today))}</h2>`);
  parts.push(
    `<p style="margin:0;color:#333;font-size:15px">${
      count
        ? `${count} thing${count === 1 ? " needs" : "s need"} a look. Until it's fixed, the affected dashboards show those figures as stopped.`
        : "Every client's figures updated normally this morning."
    }</p>`,
  );
  if (report.syncErrors.length) {
    parts.push(
      section(
        "This morning's sync hit errors",
        "The 6am update couldn't read these. If it happens again tomorrow, check the connection in Windsor.ai or Google Analytics.",
        `<ul style="margin:0;padding-left:18px;font-size:14px;color:#333">${report.syncErrors.map((error) => `<li style="margin:4px 0">${escapeHtml(error)}</li>`).join("")}</ul>`,
      ),
    );
  }
  if (fresh.length) parts.push(section("Stopped updating", "New since yesterday.", table(fresh)));
  if (mode === "test" && !fresh.length) {
    const example: DataProblem = {
      slug: "auric-performance-dashboard",
      name: "Auric Performance (example only)",
      source: "instagram",
      lastDate: iso(new Date(Date.parse(`${report.today}T00:00:00Z`) - STALE_AFTER_DAYS * 86_400_000)),
      daysAgo: STALE_AFTER_DAYS,
      isNew: true,
    };
    parts.push(section("Stopped updating", "Example only, not a real problem. This is how a new one would look.", table([example])));
  }
  if (ongoing.length) parts.push(section(mode === "alert" ? "Still waiting" : "Not updating", "These were already flagged and haven't come back yet.", table(ongoing)));
  parts.push(
    `<p style="margin:28px 0 0;color:#555;font-size:14px">${report.healthy} other client${report.healthy === 1 ? "" : "s"} updated normally. The usual fix is reconnecting the account in Windsor.ai (Facebook, Instagram, LinkedIn) or checking the property in Google Analytics.</p>`,
  );
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:680px">${parts.join("\n")}</div>`;

  const lines = [
    `Client data check, ${prettyDate(report.today)}`,
    "",
    ...(report.syncErrors.length ? ["Sync errors:", ...report.syncErrors.map((error) => `- ${error}`), ""] : []),
    ...report.problems.map((problem) => `- ${problem.name}: ${SOURCE_LABELS[problem.source] || problem.source}. ${describe(problem)}${problem.isNew ? " (new)" : ""}`),
    "",
    `${report.healthy} other clients updated normally.`,
  ];
  return { subject, html, text: lines.join("\n") };
}

// Called by the morning cron after the sync. Returns what (if anything) it sent.
export async function alertOnDataHealth(syncErrors: string[], now = new Date()) {
  const report = await checkDataHealth(syncErrors, now);
  const hasNew = report.syncErrors.length > 0 || report.problems.some((problem) => problem.isNew);
  const monday = now.getUTCDay() === 1;
  if (!hasNew && !(monday && report.problems.length)) return { sent: false, report };
  const email = renderHealthEmail(report, hasNew ? "alert" : "weekly");
  const sent = await sendEmail({ ...email, to: ALERT_TO });
  return { sent, report };
}

export async function sendHealthTest(to: string) {
  const report = await checkDataHealth([]);
  const email = renderHealthEmail(report, "test");
  const sent = await sendEmail({ ...email, to: [to] });
  return { sent, report };
}
