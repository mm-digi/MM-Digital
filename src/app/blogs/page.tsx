import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blogs" };

export default function BlogsPage() {
  return <WpHtml html={readWpPage("blogs") || ""} />;
}
