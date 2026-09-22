import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { fetchDashboard, type ClientSnapshot, type MetricTotals, type PeriodBlock } from "@/lib/api";
import { formatChange, formatDateRange, formatNumber } from "@/lib/format";
import { colors, radius, spacing } from "@/lib/theme";
import StatTile from "@/components/StatTile";

const TILES: { key: keyof MetricTotals; label: string; prefix: string }[] = [
  { key: "sessions", label: "Website sessions", prefix: "" },
  { key: "spend", label: "Ad spend", prefix: "£" },
  { key: "clicks", label: "Clicks", prefix: "" },
  { key: "impressions", label: "Impressions", prefix: "" },
  { key: "reach", label: "Reach", prefix: "" },
  { key: "engagement", label: "Engagement", prefix: "" },
  { key: "conversions", label: "Conversions", prefix: "" },
];

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
