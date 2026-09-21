export type WindsorSource =
  | "facebook_ads"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "linkedin_ads";

type ConnectorConfig = {
  source: WindsorSource;
  connector: string;
  fields: string[];
};

export const WINDSOR_CONNECTORS: ConnectorConfig[] = [
  {
    source: "facebook_ads",
    connector: "facebook",
    fields: ["date", "account_name", "campaign", "spend", "clicks", "impressions", "reach", "conversions"],
  },
  {
    source: "facebook",
    connector: "facebook_organic",
    fields: ["date", "account_name", "page_impressions", "page_fans", "page_views", "post_reactions", "page_post_engagements"],
  },
  {
    source: "instagram",
    connector: "instagram",
    fields: ["date", "account_name", "views", "reach", "likes"],
  },
  {
    source: "linkedin",
    connector: "linkedin_organic",
    fields: ["date", "account_name", "share_count", "like_count", "comment_count", "impression_count"],
  },
  {
    source: "linkedin_ads",
    connector: "linkedin",
    fields: ["date", "account_name", "impressions", "clicks", "spend"],
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
  const likes = num(row, "likes", "like_count");
  const views = num(row, "views");
  const pageViews = num(row, "page_views");
  const reactions = num(row, "post_reactions");
  const campaign = String(row.campaign || "").trim();
  return {
    date: String(row.date || "").slice(0, 10),
    accountId: String(row.account_id || ""),
    accountName: String(row.account_name || row.account || ""),
    source,
    impressions: num(row, "impressions", "page_impressions", "impression_count"),
    reach: num(row, "reach"),
    clicks: num(row, "clicks"),
    spend: num(row, "spend"),
    engagement: num(row, "engagement", "page_post_engagements", "likes", "share_count", "like_count"),
    conversions: num(row, "conversions", "leads"),
    followers: num(row, "followers", "followers_count", "follower_count", "page_fans"),
    sessions: null as number | null,
    users: null as number | null,
    extra: {
      views,
      likes,
      page_views: pageViews,
      reactions,
      campaigns: campaign
        ? [
            {
              name: campaign,
              spend: num(row, "spend") || 0,
              clicks: num(row, "clicks") || 0,
              conversions: num(row, "conversions", "leads") || 0,
            },
          ]
        : [],
    },
  };
}

function windsorApiKey() {
  const raw = (process.env.WINDSOR_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!raw) throw new Error("WINDSOR_API_KEY is not set");
  if (raw.includes("api_key=")) {
    try {
      return new URL(raw).searchParams.get("api_key") || raw;
    } catch {
      return raw.split("api_key=").pop() || raw;
    }
  }
  return raw;
}

export async function fetchWindsor(connector: string, fields: string[], datePreset = "last_90d") {
  const apiKey = windsorApiKey();

  const tryFields = [fields, fields.filter((field) => !["campaign", "account_id"].includes(field)), ["date", "account_name"]];
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
