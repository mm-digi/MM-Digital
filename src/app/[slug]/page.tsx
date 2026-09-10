import { notFound } from "next/navigation";
import Link from "next/link";
import { getDashboard } from "@/lib/clients";
import { BLOGS, CASE_STUDIES } from "@/lib/content";
import DashboardView from "@/components/DashboardView";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [
    ...BLOGS.map((b) => ({ slug: b.slug })),
    ...CASE_STUDIES.map((c) => ({ slug: c.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const blog = BLOGS.find((b) => b.slug === slug);
  const study = CASE_STUDIES.find((c) => c.slug === slug);
  return { title: dashboard?.name || blog?.title || study?.title || "MM Digital" };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  if (dashboard) return <DashboardView dashboard={dashboard} />;

  const blog = BLOGS.find((b) => b.slug === slug);
  if (blog) {
    return (
      <article className="px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-[#ff808b]">{blog.author} · {blog.date}</p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,5vw,3.6rem)] leading-tight">{blog.title}</h1>
          <p className="mt-6 text-lg leading-8 text-[#cfcfcf]">{blog.excerpt}</p>
          <p className="mt-6 leading-8 text-[#cfcfcf]">
            At MM Digital we help ambitious brands turn this kind of thinking into a working digital system — strategy, creative, paid media, SEO, websites and reporting, all joined up. If you want this applied to your business, book a strategy call and we’ll map the next steps.
          </p>
          <Link href="/get-in-touch/" className="btn-pink mt-8">Get In Touch</Link>
        </div>
      </article>
    );
  }

  const study = CASE_STUDIES.find((c) => c.slug === slug);
  if (study) {
    return (
      <article className="px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Case Study</span>
          <h1 className="mt-3 font-serif text-[clamp(2rem,5vw,3.6rem)] leading-tight">{study.title}</h1>
          <h2 className="mt-8 font-serif text-2xl" id="client-overview">Client Overview</h2>
          <p className="mt-4 leading-8 text-[#cfcfcf]">{study.summary}</p>
          <p className="mt-4 leading-8 text-[#cfcfcf]">
            MM Digital implemented a strategy designed to attract and convert potential clients, combining brand, content, paid activity and reporting into one commercial plan.
          </p>
          <Link href="/get-in-touch/" className="btn-pink mt-8">Start A Similar Project</Link>
        </div>
      </article>
    );
  }

  notFound();
}
