import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/clients";
import { readWpPage, splitDashboardHtml } from "@/lib/wp";
import DashboardView from "@/components/DashboardView";
import MetricsSnapshot from "@/components/MetricsSnapshot";
import WpHtml from "@/components/WpHtml";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  return {
    title: dashboard?.name || slug.replace(/-/g, " "),
    alternates: { canonical: `/${slug}/` },
    ...(dashboard ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const html = readWpPage(slug);
  if (dashboard && html) {
    const { hero, report } = splitDashboardHtml(html);
    return (
      <>
        <WpHtml html={hero} />
        <MetricsSnapshot slug={dashboard.slug} />
        {report ? <WpHtml html={report} /> : null}
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
