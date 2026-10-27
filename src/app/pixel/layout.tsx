import type { Metadata } from "next";
import { Nunito, Silkscreen } from "next/font/google";
import "@/pixel/pixel.css";

const pixelFont = Silkscreen({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const bodyFont = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel office",
  robots: { index: false, follow: false },
};

export default function PixelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`pixel-hq ${pixelFont.variable} ${bodyFont.variable}`}>
      <style>{`header.wp-block-template-part, footer.wp-block-template-part { display: none !important; }`}</style>
      {children}
    </div>
  );
}
