import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";

const description =
  "How MM Digital Marketing Limited collects, uses and protects your personal information when you use our website and services.";

export const metadata: Metadata = pageMetadata("Privacy Policy", description, "/privacy-policy/");

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ name: "Privacy Policy | MM Digital", path: "/privacy-policy/", description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Privacy Policy", path: "/privacy-policy/" },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("privacy-policy") || ""} />
    </>
  );
}
