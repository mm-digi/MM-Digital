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

function stripMarkup(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function getWpMetadata(slug: string) {
  const html = readWpPage(slug) || "";
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const title = stripMarkup(heading || slug.replace(/-/g, " "));
  const description = stripMarkup(paragraph || "MM Digital helps ambitious businesses grow with strategy, design and digital marketing.");
  return { title, description };
}
