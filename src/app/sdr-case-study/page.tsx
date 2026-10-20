import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "SDR Case Study";
const description =
  "How MM Digital built a custom sales channel for SDR, The Car Buying Service, with over 5,000 leads and a 4% increase in conversions.";
const path = "/sdr-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function SdrCaseStudyPage() {
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
              { name: "SDR", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("sdr-case-study") || ""} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
