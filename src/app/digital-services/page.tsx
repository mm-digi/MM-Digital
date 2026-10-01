import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Digital Services",
  "Digital strategy, web development, social media, SEO, paid ads, branding, AI automation and more: 13 services from our Exeter digital marketing team.",
  "/digital-services/",
);

export default function ServicesPage() {
  return <WpHtml html={readWpPage("digital-services") || ""} />;
}
