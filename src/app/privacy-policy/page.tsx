import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy/" }, description: "MM Digital's privacy policy and information about how we handle personal data." };

export default function PrivacyPage() {
  return <WpHtml html={readWpPage("privacy-policy") || ""} />;
}
