import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

export default function StatTile({
  label,
  value,
  change,
  wide,
}: {
  label: string;
  value: string;
  change: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.tile, wide && styles.tileWide]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.change}>{change}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  tileWide: {
    flexBasis: "100%",
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.pink,
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  change: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 4,
  },
});
