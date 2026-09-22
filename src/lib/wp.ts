import fs from "fs";
import path from "path";

export function readWpFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), "content", relativePath), "utf8");
}

export function readWpPage(slug: string) {
  const file = path.join(process.cwd(), "content/pages", `${slug}.html`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

function stripHtmlToText(fragment: string): string {
  return fragment
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#0?38;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#0?39;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

// Blog posts and case studies have no <title> of their own - they're raw WP
// block content. Pull the page's actual <h1> instead of falling back to a
// mechanical slug-to-title conversion (which turns e.g. a leftover numeric
// slug like "6135-2" into the meaningless title "6135 2").
export function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return null;
  const text = stripHtmlToText(match[1]);
  return text || null;
}

// Same problem for meta descriptions: with no per-page description, every
// blog post and case study fell back to the one site-wide default, so
// search engines saw dozens of pages with an identical description. Pull
// the first substantial paragraph of actual body copy instead.
export function extractDescriptionFromHtml(html: string): string | null {
  const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  for (const p of paragraphs) {
    const inner = p.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "");
    const text = stripHtmlToText(inner);
    // Skip short fragments like a bare date ("March 2026") or an empty
    // subheading, and bolded taglines some case studies open with (e.g.
    // "Driving Consistent Lead Generation for Ashmore Building Company") -
    // a real opening paragraph of body copy runs much longer than either.
    const isFullyBoldTagline = /^\s*(<strong>\s*)+[^<]*(\s*<\/strong>)+\s*$/i.test(inner);
    if (text.length < 100 || isFullyBoldTagline) continue;
    if (text.length <= 155) return text;
    const truncated = text.slice(0, 155);
    const lastSpace = truncated.lastIndexOf(" ");
    return `${truncated.slice(0, lastSpace > 0 ? lastSpace : 155)}…`;
  }
  return null;
}

export function splitDashboardHtml(html: string) {
  const markers = ['<section class="mm-live-report-section">', '<div class="mm-live-report-wrap">'];
  const index = markers
    .map((marker) => html.indexOf(marker))
    .filter((value) => value >= 0)
    .sort((a, b) => a - b)[0];
  if (index == null) return { hero: html, report: "" };
  return { hero: html.slice(0, index), report: html.slice(index) };
}
