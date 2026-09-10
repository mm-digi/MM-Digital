import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiePage() {
  return <WpHtml html={readWpPage("cookie-policy") || ""} />;
}
