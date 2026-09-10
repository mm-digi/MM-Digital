import Link from "next/link";
import { CASE_STUDIES, CLIENT_LOGOS } from "@/lib/content";
import Marquee from "@/components/Marquee";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our Work" };

export default function WorkPage() {
  return (
    <div className="px-5 py-16">
      <div className="mx-auto max-w-[1400px]">
        <span className="eyebrow">Our Work</span>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-tight">
          Explore MM Digital’s client work and case studies
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[#cfcfcf]">
          From website development and social media growth to paid advertising campaigns and brand positioning, we work closely with our clients to deliver marketing that performs.
        </p>
        <Marquee items={CLIENT_LOGOS} />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CASE_STUDIES.map((item) => (
            <Link key={item.slug} href={`/${item.slug}/`} className="card p-8 transition hover:-translate-y-1">
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <p className="mt-3 text-[#cfcfcf]">{item.summary}</p>
              <span className="mt-5 inline-block text-[#ff808b]">Read case study →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
