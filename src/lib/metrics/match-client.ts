export type ClientRow = {
  id: string;
  name: string;
  slug: string;
  windsor_account_name: string | null;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(ltd|limited|ads)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalize(value).replace(/ /g, "");
}

const ALIASES: Record<string, string> = {
  brsallplumbingandheatingltd: "brsbristol",
  brsplumbingheating: "brsbristol",
  brsallplumbingandheating: "brsbristol",
  orielscomedyclub: "orielsexeter",
};

export function matchClient(accountName: string, clients: ClientRow[]) {
  const needle = ALIASES[compact(accountName)] || compact(accountName);
  if (!needle) return null;

  const scored = clients
    .map((client) => {
      const names = [client.windsor_account_name, client.name, client.slug]
        .filter(Boolean)
        .map((value) => compact(String(value)));
      if (names.includes(needle)) return { client, score: 3 };
      if (names.some((name) => name && (needle.includes(name) || name.includes(needle)))) {
        return { client, score: 1 };
      }
      return null;
    })
    .filter(Boolean) as { client: ClientRow; score: number }[];

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.client || null;
}
