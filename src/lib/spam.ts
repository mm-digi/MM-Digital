import { checkBotId } from "botid/server";

// Spam checks shared by the contact and newsletter routes.
//
// WpChrome adds two hidden fields to every form: "_hp", a decoy that people
// never see but bots fill in, and "_t", how many milliseconds the page was open
// before the form was sent. Bots that post straight to the API send neither.

// Nobody reads the page and fills in a form in under 3 seconds.
const MIN_FILL_MS = 3000;
// Enquiries rarely contain links; spam is mostly links.
const MAX_LINKS = 2;

export async function isBot() {
  const verification = await checkBotId();
  return verification.isBot;
}

export function failsFormChecks(body: Record<string, unknown>) {
  if (String(body._hp ?? "").trim()) return true;
  const elapsed = Number(body._t);
  return !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
}

export function tooManyLinks(values: string[]) {
  const links = values.join(" ").match(/https?:\/\/|www\.|\[url|<a\s/gi);
  return (links?.length ?? 0) > MAX_LINKS;
}
