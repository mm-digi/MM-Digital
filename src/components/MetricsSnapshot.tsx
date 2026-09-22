import ChannelChart from "@/components/ChannelChart";
import { formatDateRange } from "@/lib/metrics/dates";
import { getClientSnapshot, type CampaignPoint, type DayPoint, type MetricTotals, type PeriodBlock } from "@/lib/metrics/snapshot";

function formatNumber(value: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

function change(current: number, previous: number) {
  if (!previous && !current) return "–";
  if (!previous) return "new";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function joinAnd(parts: string[]) {
  if (parts.length <= 1) return parts[0] || "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function buildSummary(
  name: string,
  week: PeriodBlock,
  month: PeriodBlock,
  bySourceWeek: Record<string, MetricTotals>
) {
  const weekParts: string[] = [];
  if (week.totals.sessions) {
    weekParts.push(
      `${formatNumber(week.totals.sessions)} website sessions (${change(week.totals.sessions, week.previous.sessions)} vs last week)`
    );
  }
  const instagram = bySourceWeek.instagram;
  if (instagram?.reach) weekParts.push(`${formatNumber(instagram.reach)} Instagram reach`);
  const facebook = bySourceWeek.facebook;
  if (facebook?.impressions) weekParts.push(`${formatNumber(facebook.impressions)} Facebook impressions`);
  if (week.totals.spend) weekParts.push(`£${formatNumber(week.totals.spend)} in ad spend`);
  if (week.totals.clicks) weekParts.push(`${formatNumber(week.totals.clicks)} clicks`);
  if (week.totals.engagement && !instagram?.reach && !facebook?.impressions) {
    weekParts.push(`${formatNumber(week.totals.engagement)} social engagements`);
  }

  const monthParts: string[] = [];
  if (month.totals.sessions) monthParts.push(`${formatNumber(month.totals.sessions)} website sessions`);
  if (month.totals.impressions) monthParts.push(`${formatNumber(month.totals.impressions)} impressions`);
  if (month.totals.spend) monthParts.push(`£${formatNumber(month.totals.spend)} ad spend`);

  let text = weekParts.length
    ? `This week, ${name} recorded ${joinAnd(weekParts)}.`
    : `This week’s figures for ${name} are still coming in.`;
  if (monthParts.length) {
    text += ` Over the last 30 days, that includes ${joinAnd(monthParts)}.`;
  }
  text += " These numbers update automatically each morning from Google Analytics, Facebook, Instagram and ads.";
  return text;
}

const TILES: { key: keyof MetricTotals; label: string; prefix: string }[] = [
  { key: "sessions", label: "Website sessions", prefix: "" },
  { key: "spend", label: "Ad spend", prefix: "£" },
  { key: "clicks", label: "Clicks", prefix: "" },
  { key: "impressions", label: "Impressions", prefix: "" },
  { key: "reach", label: "Reach", prefix: "" },
  { key: "engagement", label: "Engagement", prefix: "" },
  { key: "conversions", label: "Conversions", prefix: "" },
];

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

function PeriodGrid({ period, compare }: { period: PeriodBlock; compare: string }) {
  return (
    <div>
      <div className="mb-4">
        <span className="eyebrow mb-1 block">{period.label}</span>
        <p className="text-sm text-[#cfcfcf]">
          {formatDateRange(period.from, period.to)} · vs previous {compare}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {TILES.map(({ key, label, prefix }) => (
          <div key={`${period.label}-${key}`} className="card p-4 sm:p-5">
            <div className="text-xs text-[#cfcfcf] sm:text-sm">{label}</div>
            <div className="mt-2 text-xl font-bold text-[#ff808b] sm:text-2xl">
              {prefix}
              {formatNumber(period.totals[key])}
            </div>
            <div className="mt-1 text-xs text-white/60">{change(period.totals[key], period.previous[key])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceTable({ title, data }: { title: string; data: Record<string, MetricTotals> }) {
  const rows = Object.entries(data);
  if (!rows.length) return null;
  return (
    <div className="card overflow-x-auto p-5">
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-[#cfcfcf]">
          <tr>
            <th className="pb-3 font-normal">Channel</th>
            <th className="pb-3 font-normal">Sessions</th>
            <th className="pb-3 font-normal">Spend</th>
            <th className="pb-3 font-normal">Clicks</th>
            <th className="pb-3 font-normal">Impressions</th>
            <th className="pb-3 font-normal">Reach</th>
            <th className="pb-3 font-normal">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([source, totals]) => (
            <tr key={source} className="border-t border-white/10">
              <td className="py-3">{SOURCE_LABELS[source] || source}</td>
              <td>{formatNumber(totals.sessions)}</td>
              <td>£{formatNumber(totals.spend)}</td>
              <td>{formatNumber(totals.clicks)}</td>
              <td>{formatNumber(totals.impressions)}</td>
              <td>{formatNumber(totals.reach)}</td>
              <td>{formatNumber(totals.engagement)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function chartGroup(
  title: string,
  charts: [string, string, Exclude<keyof DayPoint, "date">][],
  snapshot: NonNullable<Awaited<ReturnType<typeof getClientSnapshot>>>,
  source: string
) {
  const sourceSeries = snapshot.seriesBySource[source];
  if (!sourceSeries) return null;
  const visible = charts.filter(([, , metric]) => sourceSeries.some((point) => Number(point[metric] || 0) > 0));
  if (!visible.length) return null;
  const sourceTotals = { [source]: snapshot.bySourceMonth[source] || emptySourceTotals() };
  return (
    <div>
      <h3 className="mb-4 font-serif text-2xl">{title}</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map(([chartTitle, description, metric]) => (
          <ChannelChart
            key={chartTitle}
            title={chartTitle}
            description={description}
            metric={metric}
            prefix={metric === "spend" ? "£" : ""}
            duration={metric === "avgDuration"}
            series={sourceSeries}
            seriesBySource={{ [source]: sourceSeries }}
            bySource={sourceTotals}
          />
        ))}
      </div>
    </div>
  );
}

function emptySourceTotals(): MetricTotals {
  return {
    sessions: 0,
    spend: 0,
    clicks: 0,
    impressions: 0,
    reach: 0,
    engagement: 0,
    conversions: 0,
  };
}

function CampaignBars({ campaigns }: { campaigns: CampaignPoint[] }) {
  if (!campaigns.length) return null;
  const max = Math.max(...campaigns.map((campaign) => campaign.conversions || campaign.clicks), 1);
  return (
    <div className="card p-5">
      <h3 className="font-serif text-xl">Ad leads by campaign</h3>
      <p className="mb-4 text-sm text-[#cfcfcf]">Results for each Facebook Ads campaign this month.</p>
      <div className="space-y-3">
        {campaigns.slice(0, 12).map((campaign) => (
          <div key={campaign.name}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span>{campaign.name}</span>
              <span className="text-[#ff808b]">
                {campaign.conversions || campaign.clicks} results · £{campaign.spend.toFixed(0)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#ff808b]"
                style={{ width: `${Math.max(6, ((campaign.conversions || campaign.clicks) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MetricsSnapshot({ slug }: { slug: string }) {
  let snapshot = null;
  try {
    snapshot = await getClientSnapshot(slug);
  } catch {
    return null;
  }
  if (!snapshot) return null;

  const updated = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "waiting for first sync";

  return (
    <section className="px-6 pb-8 pt-10">
      <div className="mx-auto max-w-[1600px] space-y-10">
        <div>
          <span className="eyebrow mb-2 block">Live reporting</span>
          <h2 className="font-serif text-3xl">Performance snapshot</h2>
          <p className="mt-4 max-w-4xl text-[1.08rem] leading-8 text-[#cfcfcf]">
            {buildSummary(snapshot.clientName, snapshot.week, snapshot.month, snapshot.bySourceWeek)}
          </p>
          <p className="mt-3 text-sm text-white/50">Updated {updated}.</p>
        </div>

        <PeriodGrid period={snapshot.week} compare="week" />
        <PeriodGrid period={snapshot.month} compare="month" />

        {chartGroup("Website", [
          ["Website views", "How many pages were viewed.", "pageviews"],
          ["Website sessions", "How many visits the website received.", "sessions"],
          ["Average website duration", "How long people stayed on the site.", "avgDuration"],
          ["New website users", "First-time visitors from Google Analytics.", "newUsers"],
        ], snapshot, "ga4")}

        {chartGroup("Facebook", [
          ["Facebook page views", "Times people viewed the Facebook page.", "pageViews"],
          ["Facebook followers", "Total page followers.", "followers"],
          ["Facebook page impressions", "How often Facebook content was shown.", "impressions"],
          ["Facebook post reactions", "Reactions and engagement on posts.", "reactions"],
        ], snapshot, "facebook")}

        {chartGroup("Instagram", [
          ["Instagram views", "How many times Instagram content was viewed.", "views"],
          ["Instagram followers", "Follower count from Instagram.", "followers"],
          ["Instagram reach", "Unique accounts reached.", "reach"],
          ["Instagram likes", "Likes on Instagram posts.", "likes"],
        ], snapshot, "instagram")}

        {chartGroup("LinkedIn", [
          ["LinkedIn page views", "Views of the LinkedIn page.", "pageViews"],
          ["LinkedIn total likes", "Likes on LinkedIn posts.", "likes"],
          ["LinkedIn impressions", "How often LinkedIn content was shown.", "impressions"],
          ["LinkedIn page engagement", "Shares, comments and other engagement.", "engagement"],
        ], snapshot, "linkedin")}

        {chartGroup("Facebook Ads", [
          ["Ad spend over time", "Paid spend on Facebook Ads.", "spend"],
          ["Ad results over time", "Leads and conversions from ads.", "conversions"],
          ["Ad clicks over time", "Clicks on Facebook ads.", "clicks"],
          ["Ad impressions over time", "How often ads were shown.", "impressions"],
        ], snapshot, "facebook_ads")}

        <CampaignBars campaigns={snapshot.campaigns} />

        <div className="grid gap-4 lg:grid-cols-2">
          <SourceTable title="This week by channel" data={snapshot.bySourceWeek} />
          <SourceTable title="This month by channel" data={snapshot.bySourceMonth} />
        </div>
      </div>
    </section>
  );
}
