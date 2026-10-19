import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyVideo from "./video";

const title = "Trendz Case Study";
const description =
  "How MM Digital built Trendz’s brand and digital foundations, with full social support, digital setup, and branding.";
const path = "/trendz-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function TrendzCaseStudyPage() {
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
              { name: "Trendz", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("trendz-case-study") || ""} />
      <CaseStudyVideo />
    </>
  );
}
