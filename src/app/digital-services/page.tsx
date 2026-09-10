import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Digital Services" };

export default function ServicesPage() {
  return <WpHtml html={readWpPage("digital-services") || ""} />;
}
