import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Get In Touch" };

export default function ContactPage() {
  return <WpHtml html={readWpPage("get-in-touch") || ""} />;
}
