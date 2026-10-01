import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Pricing",
  "Monthly retainers from £400 excluding VAT. Starter, Growth and Supercharged, or a fully bespoke plan. Social, paid ads and support, available 24/7.",
  "/pricing/",
);

export default function PricingPage() {
  return <WpHtml html={readWpPage("pricing") || ""} />;
}
