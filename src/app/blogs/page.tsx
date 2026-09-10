import Link from "next/link";
import { BLOGS } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blogs" };

export default function BlogsPage() {
  return (
    <div className="px-5 py-16">
      <div className="mx-auto max-w-[1200px]">
        <span className="eyebrow">Insights & Strategy</span>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.5rem)]">Our Blogs</h1>
        <p className="mt-4 max-w-3xl text-lg text-[#cfcfcf]">
          Practical marketing ideas, digital insights, and clear advice for businesses that want to grow smarter online.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {BLOGS.map((post) => (
            <Link key={post.slug} href={`/${post.slug}/`} className="card overflow-hidden transition hover:-translate-y-1">
              <div className="flex items-center gap-4 bg-white/5 p-6">
                <img src={post.image} alt="" className="h-16 w-16 object-contain" />
                <div className="text-sm text-[#ff808b]">{post.author} {post.date}</div>
              </div>
              <div className="p-7">
                <h2 className="font-serif text-2xl">{post.title}</h2>
                <p className="mt-3 text-[#cfcfcf]">{post.excerpt}</p>
                <span className="mt-4 inline-block text-[#ff808b]">Read Article →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
