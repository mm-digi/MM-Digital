import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg";
import type { DayPoint, MetricTotals } from "@/lib/api";
import { formatChartNumber, formatShortDate } from "@/lib/format";
import { colors, radius, spacing } from "@/lib/theme";

const SOURCE_LABELS: Record<string, string> = {
  ga4: "Website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

const SOURCE_COLORS: Record<string, string> = {
  ga4: "#7dd3fc",
  facebook: "#4c8dff",
  facebook_ads: "#ff808b",
  instagram: "#e1306c",
  linkedin: "#70b5f9",
  linkedin_ads: "#f5c16c",
};

type MetricKey = Exclude<keyof DayPoint, "date">;

function yTicks(max: number) {
  const raw = max <= 0 ? 1 : max;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = Math.ceil(raw / magnitude) * magnitude;
  return [0, nice * 0.25, nice * 0.5, nice * 0.75, nice];
}

function aggregate(values: number[], mode: "sum" | "last" | "avg") {
  if (mode === "last") {
    for (let i = values.length - 1; i >= 0; i -= 1) {
      if (Number(values[i] || 0) > 0) return Number(values[i]);
    }
    return 0;
  }
  if (mode === "avg") {
    const nums = values.filter((value) => Number(value) > 0);
    if (!nums.length) return 0;
    return nums.reduce((sum, value) => sum + value, 0) / nums.length;
  }
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
}

function linePoints(values: number[], max: number, left: number, top: number, plotWidth: number, plotHeight: number) {
  return values
    .map((value, index) => {
      const x = values.length === 1 ? left + plotWidth / 2 : left + (index / (values.length - 1)) * plotWidth;
      const y = top + plotHeight - (Math.max(0, Number(value) || 0) / max) * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function LineChart({
  title,
  description,
  metric,
  prefix = "",
  duration = false,
  series,
  seriesBySource,
  bySource,
}: {
  title: string;
  description: string;
  metric: MetricKey;
  prefix?: string;
  duration?: boolean;
  series: DayPoint[];
  seriesBySource: Record<string, DayPoint[]>;
  bySource: Record<string, MetricTotals>;
}) {
  // The SVG viewBox width has to track the card's actual rendered width, or
  // a fixed viewBox aspect ratio letterboxes badly on very wide cards (a
  // tablet, a phone in landscape, ...) - preserveAspectRatio="meet" then
  // scales to fit height and pads the sides instead of filling the width.
  const [measuredWidth, setMeasuredWidth] = useState(320);
  const width = measuredWidth;
  const height = 180;
  const left = 42;
  const right = 8;
  const top = 10;
  const bottom = 24;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const mode = metric === "followers" ? "last" : metric === "avgDuration" ? "avg" : "sum";

  const total = aggregate(
    series.map((point) => Number(point[metric] || 0)),
    mode
  );

  const sourceKeys = Object.keys(seriesBySource).length ? Object.keys(seriesBySource) : Object.keys(bySource);
  const sources = sourceKeys
    .map((source) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      color: SOURCE_COLORS[source] || colors.pink,
      value: aggregate(
        (seriesBySource[source] || []).map((point) => Number(point[metric] || 0)),
        mode
      ),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const allValues = [
    ...series.map((point) => Number(point[metric] || 0)),
    ...sources.flatMap((item) => (seriesBySource[item.source] || []).map((point) => Number(point[metric] || 0))),
  ];
  const ticks = yTicks(Math.max(...allValues, 1));
  const max = ticks[ticks.length - 1] || 1;

  const xIndexes =
    series.length <= 1
      ? [0]
      : [0, Math.floor((series.length - 1) / 3), Math.floor(((series.length - 1) * 2) / 3), series.length - 1];
  const uniqueX = [...new Set(xIndexes)];

  const totalLine = linePoints(
    series.map((point) => Number(point[metric] || 0)),
    max,
    left,
    top,
    plotWidth,
    plotHeight
  );

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.totalValue}>
          {formatChartNumber(total, prefix, duration)} {mode === "last" ? "now" : mode === "avg" ? "average" : "this month"}
        </Text>
      </View>
      <Text style={styles.description}>{description}</Text>

      <View
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
        }}
      >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {ticks.map((tick) => (
          <Line
            key={`grid-${tick}`}
            x1={left}
            x2={left + plotWidth}
            y1={top + plotHeight - (tick / max) * plotHeight}
            y2={top + plotHeight - (tick / max) * plotHeight}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {ticks.map((tick) => (
          <SvgText
            key={`label-${tick}`}
            x={left - 6}
            y={top + plotHeight - (tick / max) * plotHeight + 3}
            textAnchor="end"
            fill={colors.textMuted}
            fontSize="9"
          >
            {formatChartNumber(tick, prefix, duration)}
          </SvgText>
        ))}
        <Line x1={left} x2={left} y1={top} y2={top + plotHeight} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <Line
          x1={left}
          x2={left + plotWidth}
          y1={top + plotHeight}
          y2={top + plotHeight}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />
        {uniqueX.map((index) => {
          const x = series.length === 1 ? left + plotWidth / 2 : left + (index / (series.length - 1)) * plotWidth;
          return (
            <SvgText key={`x-${index}`} x={x} y={height - 6} textAnchor="middle" fill={colors.textMuted} fontSize="9">
              {formatShortDate(series[index]?.date || "")}
            </SvgText>
          );
        })}
        <Polyline points={totalLine} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
        {sources.map((item) => {
          const values = (seriesBySource[item.source] || []).map((point) => Number(point[metric] || 0));
          if (!values.length) return null;
          return (
            <Polyline
              key={item.source}
              points={linePoints(values, max, left, top, plotWidth, plotHeight)}
              fill="none"
              stroke={item.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
      </View>

      <View style={styles.legend}>
        {sources.length ? (
          sources.map((item) => (
            <View key={item.source} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.label} {formatChartNumber(item.value, prefix)}{" "}
                <Text style={styles.legendPct}>({Math.round((item.value / (total || 1)) * 100)}%)</Text>
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.legendEmpty}>No data for this metric yet.</Text>
        )}
      </View>
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
    marginBottom: spacing.sm,
  },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  totalValue: {
    color: colors.pink,
    fontSize: 13,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  legend: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.text,
    fontSize: 12,
  },
  legendPct: {
    color: colors.textFaint,
  },
  legendEmpty: {
    color: colors.textFaint,
    fontSize: 12,
  },
});
