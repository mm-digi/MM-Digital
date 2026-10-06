import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Contact Our Exeter Marketing Agency",
  "Got a project or need assistance? Contact MM Digital in Exeter or book a free 30-minute strategy call to talk through your goals.",
  "/get-in-touch/",
);

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Get In Touch", path: "/get-in-touch/" },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("get-in-touch") || ""} />
    </>
  );
}
