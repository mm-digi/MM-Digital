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

// Self-hosted Libre Baskerville. One variable file per character set covers both weights.
const FONT_FACES = [
  ["latin", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"],
  ["latin-ext", "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF"],
]
  // A face each for 400 and 700, as Google Fonts serves it, so 600 headings still snap to bold.
  .flatMap(([subset, range]) =>
    [400, 700].map((weight) => `@font-face{font-family:"Libre Baskerville";font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/libre-baskerville-${subset}.woff2) format("woff2");unicode-range:${range}}`),
  )
  .join("");

export default function RootLayout({ children }: LayoutProps<"/">) {
  const headerHtml = readWpFile("header.html");
  const footerHtml = readWpFile("footer.html");

  return (
    // The header-height script in WpChrome sets a style on <html> before React
    // hydrates, which is expected, so don't flag it as a mismatch
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Libre Baskerville is hosted here rather than loaded from Google Fonts. */}
        <link rel="preload" href="/fonts/libre-baskerville-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <style>{FONT_FACES}</style>
        <link rel="stylesheet" href="/wp-assets/wordpress.min.css" />
        <link rel="stylesheet" href="/wp-assets/extendable.min.css" />
        <link rel="stylesheet" href="/wp-assets/uag.min.css" />
        <link rel="stylesheet" href="/wp-assets/stackable.min.css" />
        <link rel="stylesheet" href="/wp-assets/stackable-responsive.min.css" />
        <link rel="stylesheet" href="/wp-assets/kadence-form.min.css" />
        <link rel="stylesheet" href="/wp-assets/kadence-column.min.css" />
        <link rel="stylesheet" href="/wp-assets/kadence-row.min.css" />
        <link rel="stylesheet" href="/wp-assets/navigation.min.css" />
        <link rel="stylesheet" href="/wp-assets/mm-fixes.min.css" />
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
