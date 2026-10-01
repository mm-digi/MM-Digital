import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Get In Touch",
  "Got a project or need assistance? Contact MM Digital in Exeter or book a free 30-minute strategy call to talk through your goals.",
  "/get-in-touch/",
);

export default function ContactPage() {
  return <WpHtml html={readWpPage("get-in-touch") || ""} />;
}
