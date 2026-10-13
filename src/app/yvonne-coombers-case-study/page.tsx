import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyVideo from "./video";

const title = "Yvonne Coomber Case Study";
const description =
  "How MM Digital grew Yvonne Coomber’s online presence to 4.9 million art lovers reached and a 57% rise in audience engagement.";
const path = "/yvonne-coombers-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function YvonneCoomberCaseStudyPage() {
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
              { name: "Yvonne Coomber", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("yvonne-coombers-case-study") || ""} />
      <CaseStudyVideo />
    </>
  );
}
