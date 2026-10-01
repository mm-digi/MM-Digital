import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "About Us",
  "Meet MM Digital, an Exeter digital marketing agency. Our team of strategists, creatives and specialists helps businesses across the UK and Europe grow.",
  "/about-us/",
);

// Pre-built page with a blog slider: rebuild every 15 minutes so a scheduled
// post's card appears soon after it goes live.
export const revalidate = 900;

export default function AboutPage() {
  return <WpHtml html={readWpPage("about-us") || ""} />;
}
