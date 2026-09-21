import { googleAccessToken } from "@/lib/metrics/google-auth";

export type Ga4Day = {
  date: string;
  sessions: number;
  users: number;
  conversions: number;
  pageviews: number;
  newUsers: number;
  avgDuration: number;
};

function parseGa4Date(value: string) {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export async function fetchGa4Property(propertyId: string, days = 30): Promise<Ga4Day[]> {
  const token = await googleAccessToken();
  const id = propertyId.replace(/^properties\//, "");
  const body = {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "conversions" },
      { name: "screenPageViews" },
      { name: "newUsers" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  };

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `GA4 ${id} failed`);
  }

  return (json.rows || []).map((row: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }) => ({
    date: parseGa4Date(row.dimensionValues?.[0]?.value || ""),
    sessions: Number(row.metricValues?.[0]?.value || 0),
    users: Number(row.metricValues?.[1]?.value || 0),
    conversions: Number(row.metricValues?.[2]?.value || 0),
    pageviews: Number(row.metricValues?.[3]?.value || 0),
    newUsers: Number(row.metricValues?.[4]?.value || 0),
    avgDuration: Number(row.metricValues?.[5]?.value || 0),
  }));
}

export async function listGa4Properties() {
  const token = await googleAccessToken();
  const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || "Could not list GA4 properties");
  }
  const properties: { account: string; displayName: string; propertyId: string }[] = [];
  for (const account of json.accountSummaries || []) {
    for (const property of account.propertySummaries || []) {
      properties.push({
        account: account.displayName || "",
        displayName: property.displayName || "",
        propertyId: String(property.property || "").replace("properties/", ""),
      });
    }
  }
  return properties;
}
