import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Get In Touch", alternates: { canonical: "/get-in-touch/" }, description: "Talk to MM Digital about your next website, SEO or digital marketing project." };

export default function ContactPage() {
  return <WpHtml html={readWpPage("get-in-touch") || ""} />;
}
