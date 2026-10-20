import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "Lost In Hound Case Study";
const description =
  "How MM Digital took Lost In Hound from a standing start to a Shopify brand with 1.5 million content views, 4,600 followers and its first sales.";
const path = "/lost-in-hound-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function LostInHoundCaseStudyPage() {
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
              { name: "Lost In Hound", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("lost-in-hound-case-study") || ""} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
