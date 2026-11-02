// Writes a minified copy of each site stylesheet next to it (wordpress.css ->
// wordpress.min.css). The layout serves the .min.css copies, so edit the plain
// files. Runs before `next dev` and `next build`; the copies are committed too,
// so the site keeps its styles even if a build skips this step.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { transform } from "lightningcss";

export const STYLESHEETS = [
  "wordpress",
  "extendable",
  "uag",
  "stackable",
  "stackable-responsive",
  "kadence-form",
  "kadence-column",
  "kadence-row",
  "navigation",
  "mm-fixes",
];

const dir = path.join(process.cwd(), "public", "wp-assets");
let before = 0;
let after = 0;
for (const name of STYLESHEETS) {
  const file = path.join(dir, `${name}.css`);
  const source = readFileSync(file);
  // errorRecovery keeps any odd WordPress rule rather than failing the build.
  const { code, warnings } = transform({ filename: file, code: source, minify: true, errorRecovery: true });
  for (const warning of warnings) console.warn(`${name}.css: ${warning.message}`);
  writeFileSync(path.join(dir, `${name}.min.css`), code);
  before += source.length;
  after += code.length;
}
console.log(`Minified ${STYLESHEETS.length} stylesheets: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
