import JsonLd from "@/components/JsonLd";
import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { breadcrumbNode, pageMetadata, webPageNode } from "@/lib/seo";

const description =
  "How the MM Digital website uses cookies, what each type does, and how you can manage your cookie preferences.";

export const metadata: Metadata = pageMetadata("Cookie Policy", description, "/cookie-policy/");

export default function CookiePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({ name: "Cookie Policy | MM Digital", path: "/cookie-policy/", description }),
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Cookie Policy", path: "/cookie-policy/" },
            ]),
          ],
        }}
      />
      <WpHtml html={readWpPage("cookie-policy") || ""} />
    </>
  );
}
