import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "Auric Performance Case Study";
const description =
  "How MM Digital built Auric Performance’s brand and website from scratch, with over 500,000 website visits.";
const path = "/auric-performance-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function AuricPerformanceCaseStudyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ name: `${title} | MM Digital`, path, description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Our Work", path: "/our-work/" },
              { name: "Auric Performance", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("auric-performance-case-study") || ""} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
