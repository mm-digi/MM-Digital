import type { Metadata } from "next";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import WpChrome from "@/components/WpChrome";
import { organizationNode, shareImage, websiteNode } from "@/lib/seo";
import { readWpFile } from "@/lib/wp";

const description =
  "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK. Get a free consultation today.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mm-digi.co.uk"),
  title: {
    default: "Digital Marketing Agency in Exeter | MM Digital",
    template: "%s | MM Digital",
  },
  description,
  applicationName: "MM Digital",
  authors: [{ name: "MM Digital", url: "https://mm-digi.co.uk/" }],
  creator: "MM Digital",
  publisher: "MM Digital",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://mm-digi.co.uk",
    siteName: "MM Digital",
    title: "Digital Marketing Agency in Exeter | MM Digital",
    description:
      "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK.",
    images: [shareImage()],
  },
  twitter: {
    card: "summary",
    title: "Digital Marketing Agency in Exeter | MM Digital",
    description:
      "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK.",
    images: [shareImage().url],
  },
  verification: {
    google: "-f4ycF8FU-e2eUhIsLQBSaFCvH8tY-4a2r7w6yilRtc",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const headerHtml = readWpFile("header.html");
  const footerHtml = readWpFile("footer.html");

  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" />
        <link rel="stylesheet" href="/wp-assets/wordpress.css" />
        <link rel="stylesheet" href="/wp-assets/extendable.css" />
        <link rel="stylesheet" href="/wp-assets/uag.css" />
        <link rel="stylesheet" href="/wp-assets/stackable.css" />
        <link rel="stylesheet" href="/wp-assets/stackable-responsive.css" />
        <link rel="stylesheet" href="/wp-assets/kadence-form.css" />
        <link rel="stylesheet" href="/wp-assets/kadence-column.css" />
        <link rel="stylesheet" href="/wp-assets/kadence-row.css" />
        <link rel="stylesheet" href="/wp-assets/navigation.css" />
        <link rel="stylesheet" href="/wp-assets/mm-fixes.css" />
      </head>
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [organizationNode(), websiteNode()],
          }}
        />
        <WpChrome headerHtml={headerHtml} footerHtml={footerHtml}>
          {children}
        </WpChrome>
      </body>
    </html>
  );
}
