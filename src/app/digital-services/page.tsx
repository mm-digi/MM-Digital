import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Services",
  description:
    "Digital strategy, web development, social media, SEO, paid ads, branding, AI automation and more: 13 services from our Exeter digital marketing team.",
};

export default function ServicesPage() {
  return <WpHtml html={readWpPage("digital-services") || ""} />;
}
