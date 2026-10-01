import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How the MM Digital website uses cookies, what each type does, and how you can manage your cookie preferences.",
};

export default function CookiePage() {
  return <WpHtml html={readWpPage("cookie-policy") || ""} />;
}
