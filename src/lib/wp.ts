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
