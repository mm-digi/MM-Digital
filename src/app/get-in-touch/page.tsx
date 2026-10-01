import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get In Touch",
  description:
    "Got a project or need assistance? Contact MM Digital in Exeter or book a free 30-minute strategy call to talk through your goals.",
};

export default function ContactPage() {
  return <WpHtml html={readWpPage("get-in-touch") || ""} />;
}
