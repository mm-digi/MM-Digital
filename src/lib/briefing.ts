import { CLIENT_DASHBOARDS } from "@/lib/clients";
import { escapeHtml, sendEmail } from "@/lib/email";
import { checkDataHealth, type DataProblem } from "@/lib/metrics/health";
import { createAdminClient } from "@/lib/supabase/admin";

// The 9am weekday team briefing. One email to everyone: which client needs the most
// help this week, then a section for each person's area. "This week" is the
// last 7 full days (up to yesterday) against the 7 days before. It goes on the
// figures alone; the office traffic lights aren't used yet.

export const BRIEFING_TO = [
  "tash@mm-digi.co.uk",
  "mariette@mm-digi.co.uk",
  "natasha@mm-digi.co.uk",
  "maximilian@mm-digi.co.uk",
];

const SITE = "https://mm-digi.co.uk";
const PINK = "#d9536a";

// A change only counts when there was enough to compare, so a client going
// from 4 visits to 2 isn't flagged as "down 50%".
const MIN = { sessions: 30, reach: 300, engagement: 20, results: 3, linkedin: 100, spend: 20 };

type Totals = {
  sessions: number;
  conversions: number;
  reach: number;
  engagement: number;
  spend: number;
  clicks: number;
  results: number;
  linkedinImpressions: number;
  linkedinEngagement: number;
  followers: number;
};

type ClientWeek = {
  slug: string;
  name: string;
  week: Totals;
  previous: Totals;
  stale: DataProblem[];
};

type Change = { slug: string; name: string; text: string; pct: number };

type Row = Record<string, number | string | null>;

function empty(): Totals {
  return { sessions: 0, conversions: 0, reach: 0, engagement: 0, spend: 0, clicks: 0, results: 0, linkedinImpressions: 0, linkedinEngagement: 0, followers: 0 };
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shift(day: string, days: number) {
  return iso(new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000));
}

const num = (value: number | string | null | undefined) => Number(value || 0);

// Followers is a running count, so the week uses each channel's last reading.
function totalsOf(rows: Row[]) {
  const totals = empty();
  const followers = new Map<string, [string, number]>();
  for (const row of rows) {
    const source = String(row.source);
    if (source === "ga4") {
      totals.sessions += num(row.sessions);
      totals.conversions += num(row.conversions);
    }
    if (source === "facebook" || source === "instagram") {
      totals.reach += num(row.reach) || num(row.impressions);
      totals.engagement += num(row.engagement);
    }
    if (source === "facebook_ads" || source === "linkedin_ads") {
      totals.spend += num(row.spend);
      totals.clicks += num(row.clicks);
      totals.results += num(row.conversions);
    }
    if (source === "linkedin") {
      totals.linkedinImpressions += num(row.impressions);
      totals.linkedinEngagement += num(row.engagement);
    }
    if ((source === "facebook" || source === "instagram") && num(row.followers) > 0) {
      const seen = followers.get(source);
      if (!seen || String(row.date) >= seen[0]) followers.set(source, [String(row.date), num(row.followers)]);
    }
  }
  for (const [, count] of followers.values()) totals.followers += count;
  return totals;
}

function pct(current: number, previous: number) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

function formatNumber(value: number, money = false) {
  const prefix = money ? "£" : "";
  if (Math.abs(value) >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (Math.abs(value) >= 1_000) return `${prefix}${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${prefix}${value.toLocaleString("en-GB", { maximumFractionDigits: money ? 2 : 0 })}`;
}

function movement(current: number, previous: number) {
  if (!previous) return current ? "new this week" : "no change";
  const value = pct(current, previous);
  if (Math.abs(value) < 3) return "about the same";
  if (value >= 200) return `${Math.floor(current / previous)}x last week`;
  return `${value > 0 ? "up" : "down"} ${Math.abs(value).toFixed(0)}%`;
}

function prettyDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

async function loadRows(clientIds: string[], from: string, to: string) {
  const supabase = createAdminClient();
  const rows: (Row & { client_id: string })[] = [];
  const page = 1000;
  for (let start = 0; ; start += page) {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("client_id, date, source, sessions, spend, clicks, impressions, reach, engagement, conversions, followers")
      .in("client_id", clientIds)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .range(start, start + page - 1);
    if (error) throw error;
    rows.push(...((data || []) as (Row & { client_id: string })[]));
    if (!data || data.length < page) break;
  }
  return rows;
}

function matchClient(rows: { id: string; slug: string }[], slug: string) {
  for (const candidate of [slug, slug.replace(/-dashboard$/, ""), slug.replace(/-2$/, "")]) {
    const found = rows.find((row) => row.slug === candidate);
    if (found) return found;
  }
  const loose = rows.filter((row) => row.slug.includes(slug.replace(/-dashboard$/, "")));
  return loose.length === 1 ? loose[0] : null;
}

async function loadWeek(now: Date) {
  const yesterday = shift(iso(now), -1);
  const weekFrom = shift(yesterday, -6);
  const prevFrom = shift(yesterday, -13);
  const supabase = createAdminClient();
  const { data: clientRows, error } = await supabase.from("clients").select("id, slug");
  if (error) throw error;
  const health = await checkDataHealth([], now).catch(() => null);
  const matched = CLIENT_DASHBOARDS.map((dashboard) => ({ dashboard, client: matchClient(clientRows || [], dashboard.slug) }));
  const ids = matched.flatMap(({ client }) => (client ? [client.id] : []));
  const rows = ids.length ? await loadRows(ids, prevFrom, yesterday) : [];

  const clients: ClientWeek[] = matched.map(({ dashboard, client }) => {
    const own = client ? rows.filter((row) => row.client_id === client.id) : [];
    return {
      slug: dashboard.slug,
      name: dashboard.name,
      week: totalsOf(own.filter((row) => String(row.date) >= weekFrom)),
      previous: totalsOf(own.filter((row) => String(row.date) < weekFrom)),
      stale: health?.problems.filter((problem) => problem.slug === dashboard.slug) ?? [],
    };
  });
  return { clients, weekFrom, yesterday, problems: health?.problems ?? [] };
}

// How much help a client needs this week, with the reasons, from the figures alone.
function needsHelp(client: ClientWeek) {
  const reasons: string[] = [];
  let score = 0;
  const drop = (label: string, current: number, previous: number, minimum: number) => {
    if (previous < minimum) return;
    const change = pct(current, previous);
    if (change > -15) return;
    score += Math.min(25, Math.abs(change) / 2);
    reasons.push(`${label} ${formatNumber(current)}, ${movement(current, previous)} on last week.`);
  };
  drop("Website visits", client.week.sessions, client.previous.sessions, MIN.sessions);
  drop("Social reach", client.week.reach, client.previous.reach, MIN.reach);
  drop("Social engagement", client.week.engagement, client.previous.engagement, MIN.engagement);
  drop("Ad results", client.week.results, client.previous.results, MIN.results);
  if (client.week.results && client.previous.results && client.previous.spend >= MIN.spend) {
    const cost = client.week.spend / client.week.results;
    const before = client.previous.spend / client.previous.results;
    if (cost > before * 1.25) {
      score += 10;
      reasons.push(`Cost per ad result up to ${formatNumber(cost, true)} from ${formatNumber(before, true)}.`);
    }
  }
  if (client.stale.length) {
    score += 15;
    reasons.push(`Figures have stopped updating (${client.stale.map((problem) => (problem.source === "ga4" ? "website" : problem.source === "all" ? "everything" : problem.source)).join(", ")}).`);
  }
  return { score, reasons };
}

function changes(clients: ClientWeek[], pick: (totals: Totals) => number, minimum: number, label: string) {
  const list: Change[] = [];
  for (const client of clients) {
    const current = pick(client.week);
    const previous = pick(client.previous);
    if (Math.max(current, previous) < minimum) continue;
    list.push({ slug: client.slug, name: client.name, pct: previous ? pct(current, previous) : 100, text: `${formatNumber(current)} ${label}, ${movement(current, previous)}` });
  }
  return {
    down: list.filter((item) => item.pct <= -15).sort((a, b) => a.pct - b.pct).slice(0, 4),
    up: list.filter((item) => item.pct >= 15).sort((a, b) => b.pct - a.pct).slice(0, 3),
  };
}

// Facebook and Instagram reach and engagement together, one line per client.
// A client with any big drop goes under "needs attention", otherwise a big rise is "going well".
function socialChanges(clients: ClientWeek[]) {
  const down: Change[] = [];
  const up: Change[] = [];
  for (const client of clients) {
    const measures = [
      { label: "reached", current: client.week.reach, previous: client.previous.reach, minimum: MIN.reach },
      { label: "engagements", current: client.week.engagement, previous: client.previous.engagement, minimum: MIN.engagement },
    ].filter((item) => Math.max(item.current, item.previous) >= item.minimum);
    if (!measures.length) continue;
    const changesFor = measures.map((item) => (item.previous ? pct(item.current, item.previous) : 100));
    const text = measures.map((item) => `${formatNumber(item.current)} ${item.label} (${movement(item.current, item.previous)})`).join(", ");
    const worst = Math.min(...changesFor);
    const best = Math.max(...changesFor);
    if (worst <= -15) down.push({ slug: client.slug, name: client.name, text, pct: worst });
    else if (best >= 15) up.push({ slug: client.slug, name: client.name, text, pct: best });
  }
  return {
    down: down.sort((a, b) => a.pct - b.pct).slice(0, 4),
    up: up.sort((a, b) => b.pct - a.pct).slice(0, 4),
  };
}

// ---------- email rendering ----------

const link = (slug: string, name: string) =>
  `<a href="${SITE}/${escapeHtml(slug)}/" style="color:#111;font-weight:bold;text-decoration:none">${escapeHtml(name)}</a>`;

function list(items: string[]) {
  if (!items.length) return "";
  return `<ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.5;color:#333">${items.map((item) => `<li style="margin:3px 0">${item}</li>`).join("")}</ul>`;
}

function group(title: string, items: string[], empty: string) {
  return `<p style="margin:14px 0 0;font-size:13px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:0.04em">${escapeHtml(title)}</p>${
    items.length ? list(items) : `<p style="margin:6px 0 0;font-size:14px;color:#777">${escapeHtml(empty)}</p>`
  }`;
}

function section(title: string, who: string, body: string) {
  return `<div style="margin:28px 0 0;padding:18px 20px;border:1px solid #eee;border-top:4px solid ${PINK};border-radius:6px">
<h3 style="margin:0;font-size:17px;color:#111">${escapeHtml(title)} <span style="font-weight:normal;color:${PINK}">· ${escapeHtml(who)}</span></h3>
${body}
</div>`;
}

const changeItems = (items: Change[]) => items.map((item) => `${link(item.slug, item.name)}: ${escapeHtml(item.text)}`);

export async function buildBriefing(now = new Date(), test = false) {
  const { clients, weekFrom, yesterday, problems } = await loadWeek(now);
  const ranked = clients
    .map((client) => ({ client, ...needsHelp(client) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const watch = ranked.slice(1, 4);
  const range = `${prettyDate(weekFrom)} to ${prettyDate(yesterday)}`;

  const sum = (pick: (totals: Totals) => number, which: "week" | "previous") => clients.reduce((total, client) => total + pick(client[which]), 0);
  const total = (label: string, pick: (totals: Totals) => number, money = false) =>
    `${escapeHtml(label)}: <strong>${formatNumber(sum(pick, "week"), money)}</strong> (${escapeHtml(movement(sum(pick, "week"), sum(pick, "previous")))})`;

  // ---- Max: the big picture
  const maxBody = [
    group(
      "Across every client",
      [
        total("Website visits", (totals) => totals.sessions),
        total("Social reach", (totals) => totals.reach),
        total("Ad spend", (totals) => totals.spend, true),
        total("Ad clicks", (totals) => totals.clicks),
        ...(sum((totals) => totals.results, "week") || sum((totals) => totals.results, "previous") ? [total("Ad results", (totals) => totals.results)] : []),
      ],
      "",
    ),
    group(
      "Data problems",
      problems.map((problem) => `${link(problem.slug, problem.name)}: ${escapeHtml(problem.source === "ga4" ? "website figures" : problem.source === "all" ? "no figures yet" : `${problem.source} figures`)}${problem.lastDate ? ` stopped ${escapeHtml(prettyDate(problem.lastDate))}` : ""}`),
      "None. Every client's figures are updating.",
    ),
  ].join("");

  // ---- Tash: websites
  const web = changes(clients, (totals) => totals.sessions, MIN.sessions, "visits");
  const conversions = clients.filter((client) => client.week.conversions > 0).sort((a, b) => b.week.conversions - a.week.conversions);
  const tashBody = [
    group("Needs attention", changeItems(web.down), "No big drops in website visits."),
    group("Going well", changeItems(web.up), "No big jumps this week."),
    group(
      "Website conversions",
      conversions.slice(0, 5).map((client) => `${link(client.slug, client.name)}: ${formatNumber(client.week.conversions)} (${escapeHtml(movement(client.week.conversions, client.previous.conversions))})`),
      "No website conversions recorded this week.",
    ),
    problems.some((problem) => problem.source === "ga4")
      ? group(
          "Google Analytics not updating",
          problems.filter((problem) => problem.source === "ga4").map((problem) => `${link(problem.slug, problem.name)}: last figures ${escapeHtml(prettyDate(problem.lastDate!))}`),
          "",
        )
      : "",
  ].join("");

  // ---- Natasha: campaigns and LinkedIn
  const ads = clients
    .filter((client) => client.week.spend > 0 || client.previous.spend > 0)
    .sort((a, b) => b.week.spend - a.week.spend)
    .map((client) => {
      const { week, previous } = client;
      if (!week.spend) return `${link(client.slug, client.name)}: paused this week (${formatNumber(previous.spend, true)} last week)`;
      const parts = [`${formatNumber(week.spend, true)} spent`, `${formatNumber(week.clicks)} clicks (${movement(week.clicks, previous.clicks)})`];
      if (week.results || previous.results) {
        parts.push(`${formatNumber(week.results)} results${week.results ? ` at ${formatNumber(week.spend / week.results, true)} each` : ""}`);
      }
      return `${link(client.slug, client.name)}: ${escapeHtml(parts.join(" · "))}`;
    });
  const linkedin = changes(clients, (totals) => totals.linkedinImpressions, MIN.linkedin, "LinkedIn impressions");
  const natashaBody = [
    group("Campaigns this week", ads, "No ad spend this week."),
    group("LinkedIn needs attention", changeItems(linkedin.down), "No big drops in LinkedIn reach."),
    group("LinkedIn going well", changeItems(linkedin.up), "No big jumps this week."),
  ].join("");

  // ---- Mariette: social media and marketing
  const social = socialChanges(clients);
  const growth = clients
    .map((client) => ({ client, gained: client.week.followers && client.previous.followers ? client.week.followers - client.previous.followers : 0 }))
    .filter((item) => item.gained > 0)
    .sort((a, b) => b.gained - a.gained)
    .slice(0, 4)
    .map(({ client, gained }) => `${link(client.slug, client.name)}: +${formatNumber(gained)} followers`);
  const marietteBody = [
    group("Needs attention", changeItems(social.down), "No big drops in social reach or engagement."),
    group("Going well", changeItems(social.up), "No big jumps this week."),
    group("Follower growth", growth, "No follower changes recorded this week."),
  ].join("");

  const topBlock = top
    ? `<div style="margin:20px 0 0;padding:18px 20px;background:#fff1f3;border-left:5px solid ${PINK};border-radius:6px">
<p style="margin:0;font-size:13px;font-weight:bold;color:${PINK};text-transform:uppercase;letter-spacing:0.04em">Needs the most help this week</p>
<p style="margin:6px 0 0;font-size:22px">${link(top.client.slug, top.client.name)}</p>
${list(top.reasons.map(escapeHtml))}
${
  watch.length
    ? `<p style="margin:14px 0 0;font-size:13px;font-weight:bold;color:#555">Also keep an eye on</p>${list(watch.map((item) => `${link(item.client.slug, item.client.name)}: ${escapeHtml(item.reasons[0])}`))}`
    : ""
}
</div>`
    : `<p style="margin:20px 0 0;font-size:15px">No client stands out as needing help this week.</p>`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:680px">
${test ? `<p style="margin:0 0 16px;padding:10px 12px;background:#f5f5f5;border-left:4px solid #999;font-size:14px">Test copy for Tash. The real one goes to Tash, Mariette, Natasha and Max at 9am, Monday to Friday.</p>` : ""}
<h2 style="margin:0;font-size:22px">Morning briefing · ${escapeHtml(prettyDate(iso(now)))}</h2>
<p style="margin:6px 0 0;color:#555;font-size:14px">This week is ${escapeHtml(range)}, compared with the 7 days before.</p>
${topBlock}
${section("The big picture", "Max", maxBody)}
${section("Websites", "Tash", tashBody)}
${section("Social media & marketing", "Mariette", marietteBody)}
${section("Campaigns & LinkedIn", "Natasha", natashaBody)}
<p style="margin:24px 0 0;color:#777;font-size:12px">Sent at 9am every weekday from the client dashboards. Click a client to open their dashboard.</p>
</div>`;

  const text = [
    `Morning briefing, ${prettyDate(iso(now))}`,
    `This week is ${range}, compared with the 7 days before.`,
    "",
    top ? `Needs the most help: ${top.client.name}\n${top.reasons.map((reason) => `- ${reason}`).join("\n")}` : "No client stands out as needing help this week.",
    ...(watch.length ? ["", "Also keep an eye on:", ...watch.map((item) => `- ${item.client.name}: ${item.reasons[0]}`)] : []),
    "",
    "Open the email in HTML for each person's section.",
  ].join("\n");

  const subject = `${test ? "[Test] " : ""}Morning briefing: ${top ? `${top.client.name} needs the most help` : "no client stands out"} this week`;
  return { subject, html, text, top: top?.client.name ?? null };
}

// test: a marked test copy to Tash. sample: the real email, unmarked, to Tash only.
export async function sendBriefing({ test = false, sample = false, now = new Date() } = {}) {
  const email = await buildBriefing(now, test);
  const to = test || sample ? [BRIEFING_TO[0]] : BRIEFING_TO;
  const sent = await sendEmail({ subject: email.subject, html: email.html, text: email.text, to });
  return { sent, to, top: email.top };
}
