import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/clients";
import { extractDescriptionFromHtml, extractTitleFromHtml, readWpPage, splitDashboardHtml } from "@/lib/wp";
import { isUnpublished } from "@/lib/schedule";
import DashboardView from "@/components/DashboardView";
import JsonLd from "@/components/JsonLd";
import MetricsSnapshot from "@/components/MetricsSnapshot";
import WpHtml from "@/components/WpHtml";
import { blogDetails, blogPostingNode, breadcrumbNode, shareImage, webPageNode } from "@/lib/seo";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

// A couple of pages use a long, descriptive hero headline as their <h1> by
// design (real on-page content, not a title-tag-friendly heading), so the
// auto-extracted title from that h1 comes out too long for search results.
const TITLE_OVERRIDES: Record<string, string> = {
  "oriels-case-study": "Case Study: Oriels Cocktail Bar",
  "why-your-business-needs-to-be-found-on-ai-search-not-just-google": "Get Found on AI Search, Not Just Google",
  "why-most-businesses-waste-their-ad-spend-and-what-to-do-instead": "Why Businesses Waste Ad Spend & How to Fix It",
};

// Hand-written meta descriptions, used instead of the first paragraph.
const DESCRIPTION_OVERRIDES: Record<string, string> = {
  "local-seo-how-to-get-your-business-found-on-google":
    "Want your business to show up when local customers search on Google? Here's how local SEO works, and the practical steps to get found in your area.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isUnpublished(slug)) return { robots: { index: false, follow: false } };
  const dashboard = getDashboard(slug);
  const html = dashboard ? null : readWpPage(slug);
  const post = html ? blogDetails(html) : null;
  const title =
    dashboard?.name || TITLE_OVERRIDES[slug] || (html && extractTitleFromHtml(html)) || slug.replace(/-/g, " ");
  const description = DESCRIPTION_OVERRIDES[slug] || (html ? extractDescriptionFromHtml(html) : null);
  const fullTitle = `${title} | MM Digital`;
  const image = post?.image ? { url: post.image, alt: post.imageAlt } : shareImage();
  return {
    title,
    alternates: { canonical: `/${slug}/` },
    ...(description ? { description } : {}),
    openGraph: {
      type: post ? "article" : "website",
      locale: "en_GB",
      siteName: "MM Digital",
      url: `/${slug}/`,
      title: fullTitle,
      ...(description ? { description } : {}),
      images: [image],
      ...(post?.datePublished ? { publishedTime: post.datePublished } : {}),
      ...(post?.author ? { authors: [post.author] } : {}),
    },
    twitter: {
      card: post?.image ? "summary_large_image" : "summary",
      title: fullTitle,
      ...(description ? { description } : {}),
      images: [image.url],
    },
    ...(dashboard ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  if (isUnpublished(slug)) notFound();
  const dashboard = getDashboard(slug);
  const html = readWpPage(slug);
  if (dashboard && html) {
    const { hero } = splitDashboardHtml(html);
    return (
      <>
        <WpHtml html={hero} />
        <MetricsSnapshot slug={dashboard.slug} />
      </>
    );
  }
  if (dashboard) {
    return (
      <>
        <MetricsSnapshot slug={dashboard.slug} />
        <DashboardView dashboard={dashboard} />
      </>
    );
  }
  if (html) {
    const description = DESCRIPTION_OVERRIDES[slug] || extractDescriptionFromHtml(html);
    const article = blogPostingNode(html, slug, description);
    const headline = extractTitleFromHtml(html);
    return (
      <>
        {article && headline ? (
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@graph": [
                webPageNode({
                  name: headline,
                  path: `/${slug}/`,
                  description: description || headline,
                }),
                breadcrumbNode([
                  { name: "Home", path: "/" },
                  { name: "Blogs", path: "/blogs/" },
                  { name: headline, path: `/${slug}/` },
                ]),
                article,
              ],
            }}
          />
        ) : null}
        <WpHtml html={html} />
      </>
    );
  }

  notFound();
}
