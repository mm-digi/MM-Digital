import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Cookie Policy",
  "How the MM Digital website uses cookies, what each type does, and how you can manage your cookie preferences.",
  "/cookie-policy/",
);

export default function CookiePage() {
  return <WpHtml html={readWpPage("cookie-policy") || ""} />;
}
