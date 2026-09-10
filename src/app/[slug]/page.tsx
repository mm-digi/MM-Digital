import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/clients";
import { readWpPage } from "@/lib/wp";
import DashboardView from "@/components/DashboardView";
import WpHtml from "@/components/WpHtml";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  return { title: dashboard?.name || slug.replace(/-/g, " ") };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  if (dashboard) return <DashboardView dashboard={dashboard} />;

  const html = readWpPage(slug);
  if (html) return <WpHtml html={html} />;

  notFound();
}
