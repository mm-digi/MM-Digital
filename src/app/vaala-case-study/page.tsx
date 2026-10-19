import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyVideo from "./video";

const title = "Vaala Case Study";
const description = "How MM Digital grew Vaala’s reach, with over 1 million social views, 12% more website traffic, and an 8% increase in enquiries.";
const path = "/vaala-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function CaseStudyPage() {
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
              { name: "Vaala", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("vaala-case-study") || ""} />
      <CaseStudyVideo />
    </>
  );
}
