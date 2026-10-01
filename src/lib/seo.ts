import type { Metadata } from "next";

// Search and sharing details for a top-level page. Each page names itself as
// the canonical URL (otherwise it inherits the homepage's and Google treats it
// as a duplicate), and gets its own title and description in link previews.
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: "MM Digital",
      url: path,
      title: `${title} | MM Digital`,
      description,
    },
  };
}
