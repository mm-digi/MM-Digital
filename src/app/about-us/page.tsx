import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";

const description =
  "Meet MM Digital, an Exeter digital marketing agency. Our team of strategists, creatives and specialists helps businesses across the UK and Europe grow.";

export const metadata: Metadata = pageMetadata("About Our Exeter Digital Marketing Team", description, "/about-us/");

// Pre-built page with a blog slider: rebuild every 15 minutes so a scheduled
// post's card appears soon after it goes live.
export const revalidate = 900;

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ type: "AboutPage", name: "About Our Exeter Digital Marketing Team | MM Digital", path: "/about-us/", description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "About Us", path: "/about-us/" },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("about-us") || ""} />
    </>
  );
}
