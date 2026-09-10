import WpHtml from "@/components/WpHtml";
import { readWpPage } from "@/lib/wp";

export default function Home() {
  return <WpHtml html={readWpPage("home") || ""} />;
}
