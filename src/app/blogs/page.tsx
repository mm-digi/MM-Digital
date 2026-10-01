import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Blogs",
  "Practical marketing advice from MM Digital: local SEO, AI search, high-converting websites, lead generation and getting more from your ad spend.",
  "/blogs/",
);

// Pre-built page with a blog slider: rebuild every 15 minutes so a scheduled
// post's card appears soon after it goes live.
export const revalidate = 900;

export default function BlogsPage() {
  return <WpHtml html={readWpPage("blogs") || ""} />;
}
