import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MM Digital Marketing Limited collects, uses and protects your personal information when you use our website and services.",
};

export default function PrivacyPage() {
  return <WpHtml html={readWpPage("privacy-policy") || ""} />;
}
