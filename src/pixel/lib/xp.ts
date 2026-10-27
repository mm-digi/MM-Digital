export function levelProgress(xp: number) {
  let level = 1;
  let need = 40;
  let rest = Math.max(0, xp);
  while (rest >= need && level < 40) {
    rest -= need;
    level += 1;
    need += 20;
  }
  return { level, into: rest, need };
}

export function milestone(doneCount: number) {
  const steps = [4, 8, 12, 20];
  const reached = steps.filter((step) => doneCount >= step);
  const next = steps.find((step) => doneCount < step) ?? null;
  const label = reached.length
    ? `${reached[reached.length - 1]} quests finished as a team. Breaks still count as part of the day.`
    : "Team quests are optional. The coffee pot is not.";
  return { count: doneCount, next, label };
}

export const ACHIEVEMENTS: Record<string, { name: string; detail: string }> = {
  look: { name: "Studio portrait", detail: "You chose a look for the office." },
  "first-quest": { name: "First quest", detail: "You finished a demo quest." },
  "five-quests": { name: "Steady pace", detail: "Five demo quests finished, at your own pace." },
  coffee: { name: "Kettle club", detail: "You took a break. Frank approves." },
  frank: { name: "Approved by Frank", detail: "Frank accepted a visitor." },
};
