import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "Aspects of Oak Case Study";
const description =
  "How MM Digital grew Aspects of Oak’s reach, with over 1 million views, 1,400 leads, and a 16% increase in enquiries.";
const path = "/aspects-of-oaks-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function AspectsOfOakCaseStudyPage() {
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
              { name: "Aspects of Oak", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("aspects-of-oaks-case-study") || ""} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
