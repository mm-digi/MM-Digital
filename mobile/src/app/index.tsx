import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { fetchDashboard, type ClientSnapshot, type DayPoint, type MetricTotals, type PeriodBlock } from "@/lib/api";
import { formatChange, formatDateRange, formatNumber } from "@/lib/format";
import { colors, radius, spacing } from "@/lib/theme";
import StatTile from "@/components/StatTile";
import LineChart from "@/components/LineChart";
import ChannelTable from "@/components/ChannelTable";

const TILES: { key: keyof MetricTotals; label: string; prefix: string }[] = [
  { key: "sessions", label: "Website sessions", prefix: "" },
  { key: "spend", label: "Ad spend", prefix: "£" },
  { key: "clicks", label: "Clicks", prefix: "" },
  { key: "impressions", label: "Impressions", prefix: "" },
  { key: "reach", label: "Reach", prefix: "" },
  { key: "engagement", label: "Engagement", prefix: "" },
  { key: "conversions", label: "Conversions", prefix: "" },
];

const CHART_GROUPS: {
  title: string;
  source: string;
  charts: [string, string, Exclude<keyof DayPoint, "date">][];
}[] = [
  {
    title: "Website",
    source: "ga4",
    charts: [
      ["Website views", "How many pages were viewed.", "pageviews"],
      ["Website sessions", "How many visits the website received.", "sessions"],
      ["Average website duration", "How long people stayed on the site.", "avgDuration"],
      ["New website users", "First-time visitors from Google Analytics.", "newUsers"],
    ],
  },
  {
    title: "Facebook",
    source: "facebook",
    charts: [
      ["Facebook page views", "Times people viewed the Facebook page.", "pageViews"],
      ["Facebook followers", "Total page followers.", "followers"],
      ["Facebook page impressions", "How often Facebook content was shown.", "impressions"],
      ["Facebook post reactions", "Reactions and engagement on posts.", "reactions"],
    ],
  },
  {
    title: "Instagram",
    source: "instagram",
    charts: [
      ["Instagram views", "How many times Instagram content was viewed.", "views"],
      ["Instagram followers", "Follower count from Instagram.", "followers"],
      ["Instagram reach", "Unique accounts reached.", "reach"],
      ["Instagram likes", "Likes on Instagram posts.", "likes"],
    ],
  },
  {
    title: "LinkedIn",
    source: "linkedin",
    charts: [
      ["LinkedIn page views", "Views of the LinkedIn page.", "pageViews"],
      ["LinkedIn total likes", "Likes on LinkedIn posts.", "likes"],
      ["LinkedIn impressions", "How often LinkedIn content was shown.", "impressions"],
      ["LinkedIn page engagement", "Shares, comments and other engagement.", "engagement"],
    ],
  },
  {
    title: "Facebook Ads",
    source: "facebook_ads",
    charts: [
      ["Ad spend over time", "Paid spend on Facebook Ads.", "spend"],
      ["Ad results over time", "Leads and conversions from ads.", "conversions"],
      ["Ad clicks over time", "Clicks on Facebook ads.", "clicks"],
      ["Ad impressions over time", "How often ads were shown.", "impressions"],
    ],
  },
];

function emptySourceTotals(): MetricTotals {
  return { sessions: 0, spend: 0, clicks: 0, impressions: 0, reach: 0, engagement: 0, conversions: 0 };
}

function ChartGroupSection({ snapshot }: { snapshot: ClientSnapshot }) {
  return (
    <>
      {CHART_GROUPS.map((group) => {
        const sourceSeries = snapshot.seriesBySource[group.source];
        if (!sourceSeries) return null;
        const visible = group.charts.filter(([, , metric]) =>
          sourceSeries.some((point) => Number(point[metric] || 0) > 0)
        );
        if (!visible.length) return null;
        const sourceTotals = { [group.source]: snapshot.bySourceMonth[group.source] || emptySourceTotals() };
        return (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.chartStack}>
              {visible.map(([chartTitle, description, metric]) => (
                <LineChart
                  key={chartTitle}
                  title={chartTitle}
                  description={description}
                  metric={metric}
                  prefix={metric === "spend" ? "£" : ""}
                  duration={metric === "avgDuration"}
                  series={sourceSeries}
                  seriesBySource={{ [group.source]: sourceSeries }}
                  bySource={sourceTotals}
                />
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
}

function PeriodSection({ period, compare }: { period: PeriodBlock; compare: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{period.label}</Text>
      <Text style={styles.sectionSubtitle}>
        {formatDateRange(period.from, period.to)} · vs previous {compare}
      </Text>
      <View style={styles.tileGrid}>
        {TILES.map(({ key, label, prefix }, index) => (
          <StatTile
            key={key}
            label={label}
            value={`${prefix}${formatNumber(period.totals[key])}`}
            change={formatChange(period.totals[key], period.previous[key])}
            wide={index === TILES.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const auth = useAuth();
  const [snapshot, setSnapshot] = useState<ClientSnapshot | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!auth.token) return;
      if (!silent) setLoading(true);
      const result = await fetchDashboard(auth.token);
      if (!result.ok) {
        setError(result.error);
        if (result.unauthorized) await auth.signOut();
      } else {
        setSnapshot(result.snapshot);
        setName(result.name);
        setError("");
      }
      setLoading(false);
      setRefreshing(false);
    },
    [auth]
  );

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.token) {
      router.replace("/login");
      return;
    }
    load();
  }, [auth.isLoading, auth.token, load]);

  if (auth.isLoading || (loading && !snapshot)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  if (!auth.token) return null;

  if (error && !snapshot) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => load()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(true);
          }}
          tintColor={colors.pink}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Live reporting</Text>
          <Text style={styles.title}>{name || snapshot?.clientName}</Text>
        </View>
        <Pressable onPress={() => auth.signOut()} hitSlop={12}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      {snapshot && (
        <>
          <PeriodSection period={snapshot.week} compare="week" />
          <PeriodSection period={snapshot.month} compare="month" />

          <ChartGroupSection snapshot={snapshot} />

          {snapshot.campaigns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ad leads by campaign</Text>
              {snapshot.campaigns.slice(0, 8).map((campaign) => (
                <View key={campaign.name} style={styles.campaignRow}>
                  <Text style={styles.campaignName} numberOfLines={2}>
                    {campaign.name}
                  </Text>
                  <Text style={styles.campaignStats}>
                    {campaign.conversions || campaign.clicks} results · £{campaign.spend.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <ChannelTable title="This week by channel" data={snapshot.bySourceWeek} />
            <ChannelTable title="This month by channel" data={snapshot.bySourceMonth} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  errorText: {
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  headerText: { flex: 1, paddingRight: spacing.md },
  eyebrow: {
    color: colors.pink,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  signOut: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  chartStack: {
    gap: spacing.sm,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  campaignRow: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingVertical: spacing.sm,
  },
  campaignName: {
    color: colors.text,
    fontSize: 14,
  },
  campaignStats: {
    color: colors.pink,
    fontSize: 13,
    marginTop: 2,
  },
});
