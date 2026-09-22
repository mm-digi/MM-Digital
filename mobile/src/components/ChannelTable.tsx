import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { MetricTotals } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { colors, radius, spacing } from "@/lib/theme";

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

const COLUMNS: { key: keyof MetricTotals; label: string; prefix: string; width: number }[] = [
  { key: "sessions", label: "Sessions", prefix: "", width: 80 },
  { key: "spend", label: "Spend", prefix: "£", width: 70 },
  { key: "clicks", label: "Clicks", prefix: "", width: 70 },
  { key: "impressions", label: "Impressions", prefix: "", width: 90 },
  { key: "reach", label: "Reach", prefix: "", width: 70 },
  { key: "engagement", label: "Engagement", prefix: "", width: 90 },
];

export default function ChannelTable({ title, data }: { title: string; data: Record<string, MetricTotals> }) {
  const rows = Object.entries(data);
  if (!rows.length) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.row}>
            <Text style={[styles.headCell, styles.channelCell]}>Channel</Text>
            {COLUMNS.map((col) => (
              <Text key={col.key} style={[styles.headCell, { width: col.width }]}>
                {col.label}
              </Text>
            ))}
          </View>
          {rows.map(([source, totals]) => (
            <View key={source} style={[styles.row, styles.dataRow]}>
              <Text style={[styles.cell, styles.channelCell, styles.channelName]}>
                {SOURCE_LABELS[source] || source}
              </Text>
              {COLUMNS.map((col) => (
                <Text key={col.key} style={[styles.cell, { width: col.width }]}>
                  {col.prefix}
                  {formatNumber(totals[col.key])}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
  },
  dataRow: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingVertical: spacing.xs,
  },
  channelCell: {
    width: 110,
  },
  channelName: {
    fontWeight: "600",
  },
  headCell: {
    color: colors.textMuted,
    fontSize: 12,
    paddingBottom: spacing.xs,
  },
  cell: {
    color: colors.text,
    fontSize: 13,
    paddingVertical: 2,
  },
});
