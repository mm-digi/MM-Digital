import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

// Pre-built page with a blog slider: rebuild every 15 minutes so a scheduled
// post's card appears soon after it goes live.
export const revalidate = 900;

export default function AboutPage() {
  return <WpHtml html={readWpPage("about-us") || ""} />;
}
