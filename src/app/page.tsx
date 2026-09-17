import WpHtml from "@/components/WpHtml";
import WeCreateTyping from "@/components/WeCreateTyping";
import { readWpPage } from "@/lib/wp";

export default function Home() {
  const [beforeTyping, afterTyping = ""] = (readWpPage("home") || "").split(
    "<!-- WE_CREATE_TYPING -->",
  );

  return (
    <>
      <WpHtml html={beforeTyping} />
      <WeCreateTyping />
      <WpHtml html={afterTyping} />
    </>
  );
}
