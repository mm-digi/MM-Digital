import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our Work", alternates: { canonical: "/our-work/" }, description: "Explore websites, campaigns and digital growth projects delivered by MM Digital." };

export default function WorkPage() {
  return <WpHtml html={readWpPage("our-work") || ""} />;
}
