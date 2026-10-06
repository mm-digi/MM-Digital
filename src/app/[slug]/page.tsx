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
  "local-seo-how-to-get-your-business-found-on-google": "Local SEO: Get Your Business Found on Google",
};

// Hand-written meta descriptions, used instead of the first paragraph.
const DESCRIPTION_OVERRIDES: Record<string, string> = {
  "local-seo-how-to-get-your-business-found-on-google":
    "Want your business to show up when local customers search on Google? Here's how local SEO works, and the practical steps to get found in your area.",
  "ai-in-business-2026":
    "AI is no longer optional, but used badly it costs money. Where AI delivers real ROI in 2026, from paid media to lead qualification, and where it fails.",
  "how-to-generate-leads-without-a-big-budget":
    "You don't need a big budget to grow your pipeline. Six practical ways to generate leads, from LinkedIn and Google Business Profile to email and referrals.",
  "marketing-in-2026":
    "Activity alone doesn't drive growth. The six things growing businesses must get right in 2026, from visibility and websites to social, paid ads and brand.",
  "smarter-marketing-2026":
    "2026 isn't about doing more marketing, it's about doing what works. What will define successful brands this year: clarity, data, AI and brand authority.",
  "what-makes-a-high-converting-website-in-2026":
    "Every business has a website. Few turn visitors into customers. Seven things high converting sites get right in 2026, from speed to clear calls to action.",
  "why-every-business-needs-a-digital-strategy":
    "Posting on social and running ads isn't a strategy. What a digital strategy really is, why most businesses don't have one, and what it changes for growth.",
  "why-most-businesses-waste-their-ad-spend-and-what-to-do-instead":
    "UK businesses spend thousands on ads and see little back. Six reasons paid campaigns fail, from targeting to landing pages, and what good paid media does.",
  "why-summer-2026-is-the-most-important-season-for-your-digital-marketing":
    "Summer is one of the biggest marketing opportunities of the year. Why it matters for your brand, and what to do now across social, paid ads, web and email.",
  "why-your-business-needs-to-be-found-on-ai-search-not-just-google":
    "People now search with ChatGPT, Perplexity and Google AI Overviews. What GEO is, how it differs from SEO, and five ways to make sure AI search finds you.",
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
