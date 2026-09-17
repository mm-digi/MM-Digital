import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy", alternates: { canonical: "/cookie-policy/" }, description: "How MM Digital uses cookies on this website." };

export default function CookiePage() {
  return <WpHtml html={readWpPage("cookie-policy") || ""} />;
}
