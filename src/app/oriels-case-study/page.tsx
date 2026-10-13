import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyVideo from "./video";

const title = "Oriels Case Study";
const description =
  "How MM Digital launched Oriels Exeter, a proudly independent cocktail bar, and grew it to 6.8 million social views and 350,000 website visits.";
const path = "/oriels-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function OrielsCaseStudyPage() {
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
              { name: "Oriels", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("oriels-case-study") || ""} />
      <CaseStudyVideo />
    </>
  );
}
