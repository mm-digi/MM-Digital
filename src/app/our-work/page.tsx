import WorkMotion from "@/components/WorkMotion";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "See the brands we have helped grow, from Oriels Exeter and Waldrons Patisserie to Auric Performance, Lost in Hound and SDR. Websites, branding and social.",
};

export default function WorkPage() {
  return (
    <>
      <WpHtml html={readWpPage("our-work") || ""} />
      <WorkMotion />
    </>
  );
}
