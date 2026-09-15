import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const OUTPUT = path.join(ROOT, "public", "media");
const SOURCE_RE = /https:\/\/mm-digi\.co\.uk\/wp-content\/uploads\/[^\s"'<>),?]+/g;
const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const GENERIC_NAME = /^(?:\d+(?:-\d+)*(?:-scaled)?|screenshot(?:-[\w-]+)?|untitled-design(?:-[\w-]+)?|m+)(?:-e\d+)?(?:-edited(?:-\d+)?)?$/i;

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : target;
    }),
  );
  return files.flat();
}

function sourceName(url) {
  const pathname = new URL(url).pathname;
  return decodeURIComponent(path.basename(pathname));
}

function cleanStem(filename) {
  return slugify(
    path
      .basename(filename, path.extname(filename))
      .replace(/-\d+x\d+$/i, "")
      .replace(/-e\d+$/i, "")
      .replace(/-scaled$/i, ""),
  );
}

function contextualStem(url, references) {
  const original = cleanStem(sourceName(url));
  if (original && !GENERIC_NAME.test(original)) return original;

  for (const reference of references) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const imageTag = reference.html.match(new RegExp(`<img[^>]+(?:src|srcset)=["'][^"']*${escaped}[^"']*["'][^>]*>`, "i"))?.[0];
    const alt = imageTag?.match(/\balt=["']([^"']+)["']/i)?.[1];
    const altStem = slugify(alt || "");
    if (altStem && !/^(image|img|photo|picture|graphic)$/.test(altStem)) {
      return `mm-digital-${altStem}`;
    }
  }

  const page = references[0]?.page || "website";
  return `mm-digital-${slugify(page)}-image`;
}

async function uniqueOutputName(base, extension, used, url) {
  let candidate = `${base}${extension}`;
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }

  const suffix = createHash("sha1").update(url).digest("hex").slice(0, 7);
  candidate = `${base}-${suffix}${extension}`;
  used.add(candidate);
  return candidate;
}

async function download(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

const files = (await walk(CONTENT)).filter((file) => file.endsWith(".html"));
const documents = [];
const referencesByUrl = new Map();

for (const file of files) {
  const html = await readFile(file, "utf8");
  const page = path.basename(file, ".html");
  documents.push({ file, html, page });
  for (const url of html.match(SOURCE_RE) || []) {
    const references = referencesByUrl.get(url) || [];
    references.push({ file, html, page });
    referencesByUrl.set(url, references);
  }
}

await mkdir(OUTPUT, { recursive: true });
const usedNames = new Set();
const replacements = new Map();
const manifest = [];

for (const [url, references] of [...referencesByUrl.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const originalName = sourceName(url);
  const originalExtension = path.extname(originalName).toLowerCase();
  const outputExtension = RASTER_EXTENSIONS.has(originalExtension) ? ".webp" : originalExtension;
  const stem = contextualStem(url, references);
  const outputName = await uniqueOutputName(stem, outputExtension, usedNames, url);
  const outputPath = path.join(OUTPUT, outputName);

  process.stdout.write(`Downloading ${originalName} -> ${outputName}\n`);
  const source = await download(url);
  const output = RASTER_EXTENSIONS.has(originalExtension)
    ? await sharp(source).rotate().webp({ quality: 82, effort: 5 }).toBuffer()
    : source;
  await writeFile(outputPath, output);

  const localUrl = `/media/${outputName}`;
  replacements.set(url, localUrl);
  manifest.push({ source: url, local: localUrl, pages: [...new Set(references.map((item) => item.page))] });
}

for (const document of documents) {
  let updated = document.html;
  for (const [source, local] of replacements) updated = updated.split(source).join(local);
  if (updated !== document.html) await writeFile(document.file, updated, "utf8");
}

await writeFile(
  path.join(OUTPUT, "wordpress-asset-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Migrated ${manifest.length} WordPress assets into public/media.`);
