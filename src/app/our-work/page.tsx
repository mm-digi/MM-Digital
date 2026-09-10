import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our Work" };

export default function WorkPage() {
  return <WpHtml html={readWpPage("our-work") || ""} />;
}
