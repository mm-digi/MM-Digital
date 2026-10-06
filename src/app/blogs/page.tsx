import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { blogListNode, breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";

const description =
  "Practical marketing advice from MM Digital: local SEO, AI search, high-converting websites, lead generation and getting more from your ad spend.";

export const metadata: Metadata = pageMetadata("Marketing Blog & Insights", description, "/blogs/");

// Pre-built page with a blog slider: rebuild every 15 minutes so a scheduled
// post's card appears soon after it goes live.
export const revalidate = 900;

export default function BlogsPage() {
  const html = readWpPage("blogs") || "";
  const posts = blogListNode(html);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ type: "Blog", name: "Marketing Blog & Insights | MM Digital", path: "/blogs/", description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Blogs", path: "/blogs/" },
            ]),
            ...(posts ? [posts] : []),
          ],
        }}
      />
      <WpHtml html={html} />
    </>
  );
}
