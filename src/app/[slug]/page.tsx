import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/clients";
import { extractDescriptionFromHtml, extractTitleFromHtml, readWpPage, splitDashboardHtml } from "@/lib/wp";
import { isUnpublished } from "@/lib/schedule";
import DashboardView from "@/components/DashboardView";
import MetricsSnapshot from "@/components/MetricsSnapshot";
import WpHtml from "@/components/WpHtml";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

// A couple of pages use a long, descriptive hero headline as their <h1> by
// design (real on-page content, not a title-tag-friendly heading), so the
// auto-extracted title from that h1 comes out too long for search results.
const TITLE_OVERRIDES: Record<string, string> = {
  "oriels-case-study": "Case Study: Oriels Cocktail Bar",
};

// Hand-written meta descriptions, used instead of the first paragraph.
const DESCRIPTION_OVERRIDES: Record<string, string> = {
  "local-seo-how-to-get-your-business-found-on-google":
    "Want your business to show up when local customers search on Google? Here's how local SEO works, and the practical steps to get found in your area.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const html = dashboard ? null : readWpPage(slug);
  const title =
    dashboard?.name || TITLE_OVERRIDES[slug] || (html && extractTitleFromHtml(html)) || slug.replace(/-/g, " ");
  const description = DESCRIPTION_OVERRIDES[slug] || (html ? extractDescriptionFromHtml(html) : null);
  return {
    title,
    alternates: { canonical: `/${slug}/` },
    ...(description ? { description } : {}),
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
  if (html) return <WpHtml html={html} />;

  notFound();
}
