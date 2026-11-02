import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import { withMoreWork } from "@/lib/more-work";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "Oriels Case Study";
const description =
  "How MM Digital grew Oriels into one of Exeter’s most in-demand venues: 7.2 million social views, 300,000 website visits and a digital booking system.";
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
      <WpHtml html={withMoreWork(readWpPage("oriels-case-study") || "", "oriels-case-study")} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
