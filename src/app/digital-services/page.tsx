import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, pageMetadata, serviceListNode, webPageNode } from "@/lib/seo";

const description =
  "Digital strategy, web development, social media, SEO, paid ads, branding, AI automation and more: 13 services from our Exeter digital marketing team.";

export const metadata: Metadata = pageMetadata("Digital Services", description, "/digital-services/");

export default function ServicesPage() {
  const html = readWpPage("digital-services") || "";
  const services = serviceListNode(html);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ name: "Digital Services | MM Digital", path: "/digital-services/", description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Digital Services", path: "/digital-services/" },
            ]),
            ...(services ? [services] : []),
          ],
        }}
      />
      <WpHtml html={html} />
    </>
  );
}
