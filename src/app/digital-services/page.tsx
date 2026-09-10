import { SERVICES } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Digital Services" };

export default function ServicesPage() {
  return (
    <div className="px-5 py-16">
      <div className="mx-auto max-w-[1400px]">
        <span className="eyebrow">What We Do</span>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-tight">
          As a full-service digital agency we offer everything you need to drive results online.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[#cfcfcf]">
          From strategy and brand identity to websites, social media, paid advertising and AI, everything we do is designed to strengthen your digital presence, attract the right audience and drive long-term growth.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((service) => (
            <article key={service.title} className="card p-7">
              <img src={service.icon} alt="" className="mb-5 h-14 w-14 object-contain" />
              <h2 className="font-serif text-2xl">{service.title}</h2>
              <p className="mt-3 text-[#cfcfcf]">{service.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
