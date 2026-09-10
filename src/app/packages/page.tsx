import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Packages" };

export default function PackagesPage() {
  return <WpHtml html={readWpPage("packages") || ""} />;
}
