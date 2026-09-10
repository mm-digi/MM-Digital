import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth";

const libre = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mm-digi.co.uk"),
  title: {
    default: "MM Digital | Digital Marketing Agency Exeter",
    template: "%s | MM Digital",
  },
  description:
    "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK. Get a free consultation today.",
  openGraph: {
    images: ["/banner.png"],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="en" className={`${libre.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link href="https://fonts.cdnfonts.com/css/glacial-indifference" rel="stylesheet" />
      </head>
      <body className="flex min-h-full flex-col">
        <Header loggedIn={Boolean(session)} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
