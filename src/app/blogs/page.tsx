import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Digital Marketing Insights & Advice", alternates: { canonical: "/blogs/" }, description: "Digital marketing insights, ideas and practical advice from MM Digital." };

export default function BlogsPage() {
  return <WpHtml html={readWpPage("blogs") || ""} />;
}
