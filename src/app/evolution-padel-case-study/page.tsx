import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "Evolution Padel Case Study";
const description = "How MM Digital built Evolution Padel’s brand from scratch, with a full brand setup and a 32% increase in pre-launch visibility.";
const path = "/evolution-padel-case-study/";

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
              { name: "Evolution Padel", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("evolution-padel-case-study") || ""} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
