import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { DASHBOARD_SLUGS } from "@/lib/clients";

const SITE_URL = "https://mm-digi.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = fs
    .readdirSync(path.join(process.cwd(), "content", "pages"))
    .filter((name) => name.endsWith(".html"))
    .map((name) => name.replace(/\.html$/, ""))
    .filter((slug) => slug !== "home" && slug !== "6135-2" && !DASHBOARD_SLUGS.has(slug));

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...pages.map((slug) => ({
      url: `${SITE_URL}/${slug}/`,
      changeFrequency: "monthly" as const,
      priority: slug === "blogs" || slug === "digital-services" || slug === "our-work" ? 0.8 : 0.6,
    })),
  ];
}
