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

export function splitDashboardHtml(html: string) {
  const markers = ['<section class="mm-live-report-section">', '<div class="mm-live-report-wrap">'];
  const index = markers
    .map((marker) => html.indexOf(marker))
    .filter((value) => value >= 0)
    .sort((a, b) => a - b)[0];
  if (index == null) return { hero: html, report: "" };
  return { hero: html.slice(0, index), report: html.slice(index) };
}
