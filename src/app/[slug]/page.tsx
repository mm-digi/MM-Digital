import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/clients";
import { extractDescriptionFromHtml, extractTitleFromHtml, readWpPage, splitDashboardHtml } from "@/lib/wp";
import DashboardView from "@/components/DashboardView";
import MetricsSnapshot from "@/components/MetricsSnapshot";
import WpHtml from "@/components/WpHtml";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const html = dashboard ? null : readWpPage(slug);
  const title = dashboard?.name || (html && extractTitleFromHtml(html)) || slug.replace(/-/g, " ");
  const description = html ? extractDescriptionFromHtml(html) : null;
  return {
    title,
    alternates: { canonical: `/${slug}/` },
    ...(description ? { description } : {}),
    ...(dashboard ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
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
