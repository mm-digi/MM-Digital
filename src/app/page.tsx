import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { ORG_ID, webPageNode } from "@/lib/seo";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

const description =
  "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK. Get a free consultation today.";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const page = webPageNode({
    name: "Digital Marketing Agency in Exeter | MM Digital",
    path: "/",
    description,
  });
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [{ ...page, mainEntity: { "@id": ORG_ID } }] }} />
      <WpHtml html={readWpPage("home") || ""} />
    </>
  );
}
