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
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchClient(accountName: string, clients: ClientRow[]) {
  const needle = normalize(accountName);
  if (!needle) return null;

  const exact = clients.find((client) => {
    const names = [client.windsor_account_name, client.name, client.slug.replace(/-/g, " ")]
      .filter(Boolean)
      .map((value) => normalize(String(value)));
    return names.includes(needle);
  });
  if (exact) return exact;

  return (
    clients.find((client) => {
      const names = [client.windsor_account_name, client.name]
        .filter(Boolean)
        .map((value) => normalize(String(value)));
      return names.some((name) => name && (needle.includes(name) || name.includes(needle)));
    }) || null
  );
}
