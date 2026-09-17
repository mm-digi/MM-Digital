import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Digital Services", alternates: { canonical: "/digital-services/" }, description: "SEO, web design and digital marketing services from MM Digital in Exeter." };

export default function ServicesPage() {
  return <WpHtml html={readWpPage("digital-services") || ""} />;
}
