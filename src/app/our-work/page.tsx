import WorkMotion from "@/components/WorkMotion";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Our Work",
  "See the brands we have helped grow, from Oriels Exeter and Waldrons Patisserie to Auric Performance, Lost in Hound and SDR. Websites, branding and social.",
  "/our-work/",
);

export default function WorkPage() {
  return (
    <>
      <WpHtml html={readWpPage("our-work") || ""} />
      <WorkMotion />
    </>
  );
}
