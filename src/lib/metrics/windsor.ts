export type WindsorSource =
  | "facebook_ads"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "linkedin_ads"
  | "amazon";

type ConnectorConfig = {
  source: WindsorSource;
  connector: string;
  fields: string[];
};

const AMAZON_REPORT = "sales_and_traffic_report_by_date__";
const AMAZON_FIELDS = {
  sales: `${AMAZON_REPORT}salesbydate_orderedproductsales_amount`,
  orders: `${AMAZON_REPORT}salesbydate_totalorderitems`,
  units: `${AMAZON_REPORT}salesbydate_unitsordered`,
  sessions: `${AMAZON_REPORT}trafficbydate_sessions`,
  pageViews: `${AMAZON_REPORT}trafficbydate_pageviews`,
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
  // LinkedIn Ads isn't connected in Windsor on purpose, so it isn't synced.
  {
    // Amazon Seller Central's daily sales and traffic report.
    source: "amazon",
    connector: "amazon_sp",
    fields: ["date", "account_name", ...Object.values(AMAZON_FIELDS)],
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

type Campaign = { name: string; spend: number; clicks: number; conversions: number };

export type WindsorMetrics = {
  date: string;
  accountId: string;
  accountName: string;
  source: WindsorSource;
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  spend: number | null;
  engagement: number | null;
  conversions: number | null;
  followers: number | null;
  sessions: number | null;
  users: number | null;
  extra: {
    views: number | null;
    likes: number | null;
    page_views: number | null;
    reactions: number | null;
    campaigns: Campaign[];
    sales?: number | null;
    orders?: number | null;
    units?: number | null;
    store_sessions?: number | null;
    store_page_views?: number | null;
  };
};

export function rowToMetrics(source: WindsorSource, row: WindsorRow): WindsorMetrics {
  if (source === "amazon") return amazonRowToMetrics(row);
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
    sessions: null,
    users: null,
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

// Amazon figures all go in extra, never the shared columns, so store visits
// aren't added to website sessions or orders to ad leads in the totals.
function amazonRowToMetrics(row: WindsorRow): WindsorMetrics {
  return {
    date: String(row.date || "").slice(0, 10),
    accountId: String(row.account_id || ""),
    accountName: String(row.account_name || row.account || ""),
    source: "amazon",
    impressions: null,
    reach: null,
    clicks: null,
    spend: null,
    engagement: null,
    conversions: null,
    followers: null,
    sessions: null,
    users: null,
    extra: {
      views: null,
      likes: null,
      page_views: null,
      reactions: null,
      campaigns: [],
      sales: num(row, AMAZON_FIELDS.sales),
      orders: num(row, AMAZON_FIELDS.orders),
      units: num(row, AMAZON_FIELDS.units),
      store_sessions: num(row, AMAZON_FIELDS.sessions),
      store_page_views: num(row, AMAZON_FIELDS.pageViews),
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
