import type { ClientSnapshot, DayPoint, MetricTotals } from "@/lib/metrics/snapshot";

// Pre-written answers for the dashboard assistant. Each answer is worked out from
// the same snapshot the dashboard shows, so there's no AI involved yet. When we
// add AI, these questions can stay as the suggested prompts.

export type Insight = {
  id: string;
  question: string;
  answer: string[];
};

const SOURCE_LABELS: Record<string, string> = {
  ga4: "your website",
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_ads: "LinkedIn Ads",
};

// The number that matters most for each channel, used to compare channels fairly.
const HEADLINE_METRIC: Record<string, [keyof MetricTotals, string]> = {
  ga4: ["sessions", "visits"],
  facebook: ["impressions", "impressions"],
  instagram: ["reach", "accounts reached"],
  linkedin: ["impressions", "impressions"],
  facebook_ads: ["conversions", "results"],
  linkedin_ads: ["clicks", "clicks"],
};

function formatNumber(value: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (Number.isInteger(value)) return value.toLocaleString("en-GB");
  return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return minutes ? `${minutes}m ${String(total % 60).padStart(2, "0")}s` : `${total}s`;
}

function pct(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// "up 23%", "down 5%", "about the same", or "new this period".
function movement(current: number, previous: number) {
  const value = pct(current, previous);
  if (value === null) return current ? "new this period" : "no change";
  if (Math.abs(value) < 3) return "about the same";
  if (value >= 200) return `${Math.floor(current / previous)}x higher`;
  return `${value > 0 ? "up" : "down"} ${Math.abs(value).toFixed(0)}%`;
}

function joinAnd(parts: string[]) {
  if (parts.length <= 1) return parts[0] || "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function compareTotals(totals: MetricTotals, previous: MetricTotals) {
  const lines: string[] = [];
  const add = (key: keyof MetricTotals, label: string, money = false) => {
    if (!totals[key] && !previous[key]) return;
    const value = money ? formatMoney(totals[key]) : formatNumber(totals[key]);
    lines.push(`${capitalise(label)}: ${value} (${movement(totals[key], previous[key])})`);
  };
  add("sessions", "website visits");
  add("impressions", "impressions");
  add("reach", "reach");
  add("engagement", "engagement");
  add("clicks", "clicks");
  add("spend", "ad spend", true);
  return lines;
}

// Overall direction across the headline numbers, ignoring spend (more spend isn't "better").
function verdict(totals: MetricTotals, previous: MetricTotals) {
  const keys: (keyof MetricTotals)[] = ["sessions", "impressions", "reach", "engagement", "clicks"];
  const changes = keys.map((key) => pct(totals[key], previous[key])).filter((value): value is number => value !== null);
  if (!changes.length) return null;
  const ups = changes.filter((value) => value >= 3).length;
  const downs = changes.filter((value) => value <= -3).length;
  if (ups && !downs) return "Everything we track is moving in the right direction.";
  if (ups > downs) return "Most of your numbers are up.";
  if (downs > ups) return "A few of your numbers have dipped.";
  return "It's a mixed picture, with some numbers up and some down.";
}

function periodAnswer(name: string, period: ClientSnapshot["month"], unit: string) {
  const lines = compareTotals(period.totals, period.previous);
  if (!lines.length) return [`We don't have enough data yet to compare this ${unit} with last ${unit} for ${name}.`];
  const answer = [`Here's how the last ${unit === "month" ? "30" : "7"} days compare with the ${unit} before.`];
  const summary = verdict(period.totals, period.previous);
  if (summary) answer.push(summary);
  return [...answer, ...lines];
}

function channelChanges(snapshot: ClientSnapshot) {
  return Object.entries(snapshot.bySourceMonth)
    .map(([source, totals]) => {
      const [key, label] = HEADLINE_METRIC[source] || ["impressions", "impressions"];
      const previous = snapshot.bySourcePrevMonth[source]?.[key] || 0;
      return { source, label, current: totals[key], previous, change: pct(totals[key], previous) };
    })
    .filter((channel) => channel.current || channel.previous);
}

function channelAnswer(snapshot: ClientSnapshot) {
  const channels = channelChanges(snapshot);
  const compared = channels.filter((channel) => channel.change !== null).sort((a, b) => b.change! - a.change!);
  if (!compared.length) {
    return ["We need another month of data before we can compare your channels fairly."];
  }
  const best = compared[0];
  const answer = [
    `${capitalise(SOURCE_LABELS[best.source] || best.source)} is your strongest channel this month, with ${formatNumber(best.current)} ${best.label} (${movement(best.current, best.previous)} on last month).`,
  ];
  const worst = compared[compared.length - 1];
  if (compared.length > 1 && worst.change! < -3) {
    answer.push(
      `${capitalise(SOURCE_LABELS[worst.source] || worst.source)} has slowed down, with ${formatNumber(worst.current)} ${worst.label} (${movement(worst.current, worst.previous)}). We'll be looking at what we can do there.`
    );
  }
  const others = compared.slice(1, compared.length > 1 && worst.change! < -3 ? -1 : undefined);
  if (others.length) {
    answer.push(
      `Everything else: ${joinAnd(others.map((channel) => `${SOURCE_LABELS[channel.source] || channel.source} ${movement(channel.current, channel.previous)}`))}.`
    );
  }
  return answer;
}

function websiteAnswer(snapshot: ClientSnapshot) {
  const totals = snapshot.bySourceMonth.ga4;
  const previousSessions = snapshot.bySourcePrevMonth.ga4?.sessions || 0;
  const series = snapshot.seriesBySource.ga4 || [];
  const answer = [
    previousSessions
      ? `Your website had ${formatNumber(totals.sessions)} visits in the last 30 days, ${movement(totals.sessions, previousSessions)} on the 30 days before.`
      : `Your website had ${formatNumber(totals.sessions)} visits in the last 30 days.`,
  ];
  const newUsers = series.reduce((sum, point) => sum + point.newUsers, 0);
  if (newUsers) answer.push(`${formatNumber(newUsers)} of those were from people visiting for the first time.`);
  const durations = series.map((point) => point.avgDuration).filter((value) => value > 0);
  if (durations.length) {
    const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    answer.push(`On average, people stayed on the site for ${formatDuration(average)}.`);
  }
  const busiest = [...series].sort((a, b) => b.sessions - a.sessions)[0];
  if (busiest?.sessions) {
    const day = new Date(`${busiest.date}T00:00:00Z`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
    answer.push(`Your busiest day was ${day}, with ${formatNumber(busiest.sessions)} visits.`);
  }
  return answer;
}

function adsAnswer(snapshot: ClientSnapshot) {
  const ads = Object.entries(snapshot.bySourceMonth).filter(([, totals]) => totals.spend > 0);
  const answer: string[] = [];
  for (const [source, totals] of ads) {
    const previous = snapshot.bySourcePrevMonth[source];
    const label = SOURCE_LABELS[source] || source;
    const results = totals.conversions || totals.clicks;
    const resultLabel = totals.conversions ? "results" : "clicks";
    let line = `On ${label}, you spent ${formatMoney(totals.spend)} and got ${formatNumber(results)} ${resultLabel}`;
    if (results) line += `, which works out at ${formatMoney(totals.spend / results)} each`;
    answer.push(`${line}.`);
    if (previous?.spend) {
      const previousResults = totals.conversions ? previous.conversions : previous.clicks;
      if (results && previousResults) {
        const cost = totals.spend / results;
        const previousCost = previous.spend / previousResults;
        const cheaper = cost < previousCost;
        answer.push(
          `That's ${formatMoney(Math.abs(previousCost - cost))} ${cheaper ? "less" : "more"} per ${resultLabel === "results" ? "result" : "click"} than last month${cheaper ? ", so your budget is going further." : "."}`
        );
      }
    }
    if (totals.impressions && totals.clicks) {
      answer.push(`${((totals.clicks / totals.impressions) * 100).toFixed(2)}% of people who saw your ads clicked them.`);
    }
  }
  const top = snapshot.campaigns.find((campaign) => campaign.conversions || campaign.clicks);
  if (top) {
    const results = top.conversions || top.clicks;
    answer.push(
      `Your best campaign is “${top.name}”, with ${formatNumber(results)} ${top.conversions ? "results" : "clicks"} from ${formatMoney(top.spend)}.`
    );
  }
  return answer;
}

function followerChange(series: DayPoint[]) {
  const readings = series.map((point) => point.followers).filter((value) => value > 0);
  if (readings.length < 2) return null;
  return { start: readings[0], end: readings[readings.length - 1] };
}

function followersAnswer(snapshot: ClientSnapshot) {
  const answer: string[] = [];
  for (const [source, series] of Object.entries(snapshot.seriesBySource)) {
    const change = followerChange(series);
    if (!change) continue;
    const label = SOURCE_LABELS[source] || source;
    const gained = change.end - change.start;
    if (gained > 0) {
      answer.push(`${capitalise(label)} grew by ${formatNumber(gained)} followers to ${formatNumber(change.end)}.`);
    } else if (gained < 0) {
      answer.push(`${capitalise(label)} is down ${formatNumber(-gained)} followers to ${formatNumber(change.end)}.`);
    } else {
      answer.push(`${capitalise(label)} held steady at ${formatNumber(change.end)} followers.`);
    }
  }
  if (answer.length) answer.unshift("Over the last 30 days:");
  return answer;
}

function focusAnswer(snapshot: ClientSnapshot) {
  const compared = channelChanges(snapshot)
    .filter((channel) => channel.change !== null)
    .sort((a, b) => a.change! - b.change!);
  const answer: string[] = [];
  const weakest = compared[0];
  if (weakest && weakest.change! < -3) {
    answer.push(
      `The biggest opportunity right now is ${SOURCE_LABELS[weakest.source] || weakest.source}, where ${weakest.label} are ${movement(weakest.current, weakest.previous)} this month.`
    );
  }
  const strongest = compared[compared.length - 1];
  if (strongest && strongest.change! > 3 && strongest !== weakest) {
    answer.push(
      `${capitalise(SOURCE_LABELS[strongest.source] || strongest.source)} is working well (${movement(strongest.current, strongest.previous)}), so it's worth building on.`
    );
  }
  if (!answer.length) answer.push("Your channels are fairly steady this month, which is a good base to grow from.");
  answer.push("Your account manager can talk you through a plan. Call us on 07880 601123 any time.");
  return answer;
}

export function buildInsights(snapshot: ClientSnapshot): Insight[] {
  const insights: Insight[] = [
    {
      id: "month",
      question: "How am I doing this month compared to last month?",
      answer: periodAnswer(snapshot.clientName, snapshot.month, "month"),
    },
    {
      id: "week",
      question: "How did this week compare to last week?",
      answer: periodAnswer(snapshot.clientName, snapshot.week, "week"),
    },
    { id: "channel", question: "Which channel is doing best?", answer: channelAnswer(snapshot) },
  ];
  if (snapshot.bySourceMonth.ga4?.sessions) {
    insights.push({ id: "website", question: "How is my website doing?", answer: websiteAnswer(snapshot) });
  }
  if (Object.values(snapshot.bySourceMonth).some((totals) => totals.spend > 0)) {
    insights.push({ id: "ads", question: "Are my ads worth the money?", answer: adsAnswer(snapshot) });
  }
  const followers = followersAnswer(snapshot);
  if (followers.length) {
    insights.push({ id: "followers", question: "Are my followers growing?", answer: followers });
  }
  insights.push({ id: "focus", question: "What should we focus on next?", answer: focusAnswer(snapshot) });
  return insights;
}
