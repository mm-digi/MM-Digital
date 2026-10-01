import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Privacy Policy",
  "How MM Digital Marketing Limited collects, uses and protects your personal information when you use our website and services.",
  "/privacy-policy/",
);

export default function PrivacyPage() {
  return <WpHtml html={readWpPage("privacy-policy") || ""} />;
}
