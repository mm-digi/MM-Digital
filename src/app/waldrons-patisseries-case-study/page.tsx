import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import CaseStudyStats from "@/components/CaseStudyStats";
import CaseStudyVideo from "./video";

const title = "Waldron’s Patisserie Case Study";
const description =
  "How MM Digital rebuilt Waldron’s Patisserie’s digital presence, with 5 million social views, 13% higher sales, and 19% more website visitors.";
const path = "/waldrons-patisseries-case-study/";

export const metadata: Metadata = pageMetadata(title, description, path);

export default function WaldronsPatisserieCaseStudyPage() {
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
              { name: "Waldron’s Patisserie", path },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("waldrons-patisseries-case-study") || ""} />
      <CaseStudyVideo />
      <CaseStudyStats />
    </>
  );
}
