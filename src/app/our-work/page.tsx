import JsonLd from "@/components/JsonLd";
import WorkMotion from "@/components/WorkMotion";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";

const description =
  "See the brands we have helped grow, from Oriels Exeter and Waldrons Patisserie to Auric Performance, Lost in Hound and SDR. Websites, branding and social.";

export const metadata: Metadata = pageMetadata("Our Work", description, "/our-work/");

export default function WorkPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({
              type: "CollectionPage",
              name: "Our Work | MM Digital",
              path: "/our-work/",
              description,
            }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Our Work", path: "/our-work/" },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("our-work") || ""} />
      <WorkMotion />
    </>
  );
}
