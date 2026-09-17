import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/clients";
import { getWpMetadata, readWpPage } from "@/lib/wp";
import DashboardView from "@/components/DashboardView";
import WpHtml from "@/components/WpHtml";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const page = getWpMetadata(slug);
  return {
    title: dashboard
      ? dashboard.name
      : { absolute: `${page.title.slice(0, 58)}${page.title.length > 58 ? "…" : ""}` },
    description: page.description.slice(0, 155),
    alternates: { canonical: `/${slug}/` },
    ...(dashboard ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const html = readWpPage(slug);
  if (dashboard && html) return <WpHtml html={html} />;
  if (dashboard) return <DashboardView dashboard={dashboard} />;
  if (html) return <WpHtml html={html} />;

  notFound();
}
