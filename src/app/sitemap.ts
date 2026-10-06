import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { DASHBOARD_SLUGS } from "@/lib/clients";
import { isUnpublished } from "@/lib/schedule";
import { blogDetails } from "@/lib/seo";

// Rebuild every 15 minutes so scheduled posts join the sitemap once live.
export const revalidate = 900;

// Only blog posts carry a <lastmod>, taken from the date printed on the post.
// File modification times can't be used: every deploy checks the repository
// out fresh, so they all read as the deploy time and every page would claim to
// have just changed, which teaches search engines to ignore the dates.

const SITE_URL = "https://mm-digi.co.uk";
const COMMERCIAL = new Set(["blogs", "digital-services", "our-work", "pricing", "about-us", "get-in-touch"]);
const LOW = new Set(["cookie-policy", "privacy-policy"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const dir = path.join(process.cwd(), "content", "pages");
  const pages = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".html"))
    .map((name) => name.replace(/\.html$/, ""))
    .filter((slug) => slug !== "home" && !DASHBOARD_SLUGS.has(slug) && !isUnpublished(slug));

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...pages.map((slug) => {
      const file = path.join(dir, `${slug}.html`);
      const html = fs.readFileSync(file, "utf8");
      const post = blogDetails(html);
      const priority = COMMERCIAL.has(slug) ? 0.8 : LOW.has(slug) ? 0.3 : post ? 0.7 : 0.6;
      return {
        url: `${SITE_URL}/${slug}/`,
        ...(post?.datePublished ? { lastModified: post.datePublished } : {}),
        changeFrequency: slug === "blogs" ? ("weekly" as const) : ("monthly" as const),
        priority,
      };
    }),
  ];
}
