import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, faqNode, pageMetadata, webPageNode } from "@/lib/seo";

const description =
  "Monthly retainers from £400 excluding VAT. Starter, Growth and Supercharged, or a fully bespoke plan. Social, paid ads and support, available 24/7.";

export const metadata: Metadata = pageMetadata("Digital Marketing Packages & Pricing", description, "/pricing/");

export default function PricingPage() {
  const html = readWpPage("pricing") || "";
  const faq = faqNode(html);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ name: "Digital Marketing Packages & Pricing | MM Digital", path: "/pricing/", description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Pricing", path: "/pricing/" },
            ]),
            ...(faq ? [faq] : []),
          ],
        }}
      />
      <WpHtml html={html} />
    </>
  );
}
