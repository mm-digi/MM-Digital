import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us", alternates: { canonical: "/about-us/" }, description: "Meet MM Digital, an Exeter digital marketing agency helping ambitious brands grow." };

export default function AboutPage() {
  return <WpHtml html={readWpPage("about-us") || ""} />;
}
