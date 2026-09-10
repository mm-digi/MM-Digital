import type { Metadata } from "next";
import "./globals.css";
import WpChrome from "@/components/WpChrome";
import { readWpFile } from "@/lib/wp";

export const metadata: Metadata = {
  metadataBase: new URL("https://mm-digi.co.uk"),
  title: {
    default: "MM Digital | Digital Marketing Agency Exeter",
    template: "%s | MM Digital",
  },
  description:
    "We help businesses grow with SEO, web design and digital marketing. Based in Exeter, UK. Get a free consultation today.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const headerHtml = readWpFile("header.html");
  const footerHtml = readWpFile("footer.html");

  return (
    <html lang="en">
      <head>
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
        <script src="https://cdn.jsdelivr.net/npm/tsparticles@2/tsparticles.bundle.min.js" async></script>
      </head>
      <body>
        <WpChrome headerHtml={headerHtml} footerHtml={footerHtml}>
          {children}
        </WpChrome>
      </body>
    </html>
  );
}
