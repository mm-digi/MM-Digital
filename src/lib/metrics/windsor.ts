export type WindsorSource =
  | "facebook_ads"
  | "facebook"
  | "instagram"
  | "linkedin";

type ConnectorConfig = {
  source: WindsorSource;
  connector: string;
  fields: string[];
};

export const WINDSOR_CONNECTORS: ConnectorConfig[] = [
  {
    source: "facebook_ads",
    connector: "facebook",
    fields: ["date", "account_id", "account_name", "spend", "clicks", "impressions", "reach", "conversions"],
  },
  {
    source: "facebook",
    connector: "facebook_organic",
    fields: ["date", "account_id", "account_name", "page_impressions", "page_post_engagements", "page_fans", "impressions", "reach", "engagement", "followers_count"],
  },
  {
    source: "instagram",
    connector: "instagram",
    fields: ["date", "account_id", "account_name", "impressions", "reach", "engagement", "follower_count", "followers_count", "clicks"],
  },
  {
    source: "linkedin",
    connector: "linkedin_organic",
    fields: ["date", "account_id", "account_name", "impressions", "clicks", "engagement", "followers", "followers_count"],
  },
];

export type WindsorRow = {
  date?: string;
  account_id?: string;
  account_name?: string;
  [key: string]: string | number | null | undefined;
};

function num(row: WindsorRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined || value === "") continue;
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

export function rowToMetrics(source: WindsorSource, row: WindsorRow) {
  return {
    date: String(row.date || "").slice(0, 10),
    accountId: String(row.account_id || ""),
    accountName: String(row.account_name || row.account || ""),
    source,
    impressions: num(row, "impressions", "page_impressions"),
    reach: num(row, "reach"),
    clicks: num(row, "clicks"),
    spend: num(row, "spend"),
    engagement: num(row, "engagement", "page_post_engagements"),
    conversions: num(row, "conversions"),
    followers: num(row, "followers", "followers_count", "follower_count", "page_fans"),
    sessions: null as number | null,
    users: null as number | null,
  };
}

export async function fetchWindsor(connector: string, fields: string[], datePreset = "last_30d") {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) throw new Error("WINDSOR_API_KEY is not set");

  const tryFields = [fields, ["date", "account_id", "account_name"]];
  let lastError = "";

  for (const fieldSet of tryFields) {
    const url = new URL(`https://connectors.windsor.ai/${connector}`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("date_preset", datePreset);
    url.searchParams.set("fields", fieldSet.join(","));

    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      lastError = json.error || `Windsor ${connector} failed (${res.status})`;
      continue;
    }
    const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return rows as WindsorRow[];
  }

  throw new Error(lastError || `Windsor ${connector} failed`);
}
