import Link from "next/link";
import { BLOGS } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="px-5 py-16">
      <div className="mx-auto max-w-[1200px]">
        <span className="eyebrow">About Us</span>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-tight">
          We Create Massive Digital Strategies
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#cfcfcf]">
          Digital marketing agency based in Exeter, working across the UK & Europe.
        </p>
        <Link href="/our-work/" className="btn-pink mt-6">See More</Link>

        <div className="card mt-12 p-8 leading-7 text-[#cfcfcf]">
          <p>
            At MM Digital, we’re driven by clarity, performance and meaningful growth. Based in Exeter, our team brings together strategic thinkers, creative problem solvers and digital specialists who are united by one goal, delivering measurable results for our clients across the UK and Europe.
          </p>
          <p className="mt-4">
            Since launching MM Digital, we’ve focused on one thing, delivering measurable commercial results. From increasing bookings and generating qualified leads to strengthening online visibility and refining brand positioning, our work is built around outcomes that directly impact the bottom line.
          </p>
        </div>

        <h2 className="mt-20 font-serif text-4xl">Our Team</h2>
        <p className="mt-3 text-[#cfcfcf]">Get to know our team.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Maximilian Madl", "Founder & Director", "/team/max.png", "https://www.linkedin.com/in/maximillian-madl-0637b6139/"],
            ["Tash Card", "Senior Web Specialist", "/team/natasha-heasman.jpg", "https://www.linkedin.com/in/natasha-card-a2b40b195/"],
            ["Mariette James", "Marketing & Social Media Executive", "/team/mariette.png", "https://www.linkedin.com/in/mariettejames/"],
            ["Natasha Heasman-Langley", "Campaign Manager", "/team/natasha-heasman.jpg", "https://www.linkedin.com/"],
          ].map(([name, role, img, linkedin]) => (
            <div key={name} className="card overflow-hidden">
              <img src={img} alt={name} className="h-72 w-full object-cover" />
              <div className="p-6">
                <h3 className="font-serif text-2xl">{name}</h3>
                <p className="mt-1 text-[#ff808b]">{role}</p>
                <a href={linkedin} className="mt-3 inline-block text-sm" target="_blank" rel="noreferrer">in</a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {[["Innovation", "We continuously explore new technologies, strategies and trends so our clients stay ahead of the curve."], ["Collaboration", "Your business objectives become our objectives. We adapt quickly and keep you in the loop."], ["Results", "Every strategy we implement is designed to drive growth, boost engagement and increase ROI."]].map(([title, text]) => (
            <div key={title} className="card p-7">
              <h3 className="font-serif text-2xl">{title}</h3>
              <p className="mt-3 text-[#cfcfcf]">{text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-20 font-serif text-4xl">Our Blogs</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {BLOGS.slice(0, 3).map((post) => (
            <Link key={post.slug} href={`/${post.slug}/`} className="card p-6">
              <div className="text-sm text-[#ff808b]">{post.date}</div>
              <h3 className="mt-2 font-serif text-xl">{post.title}</h3>
              <p className="mt-3 text-sm text-[#cfcfcf]">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
