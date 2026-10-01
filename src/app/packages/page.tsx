import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packages",
  description:
    "Monthly marketing packages from £350: Starter, Growth and Supercharged, or a fully bespoke retainer. Social, SEO, paid ads and support, available 24/7.",
};

export default function PackagesPage() {
  return <WpHtml html={readWpPage("packages") || ""} />;
}
