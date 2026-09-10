import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Packages" };

const packages = [
  {
    name: "Foundation",
    detail: "A clear starting point for brands that need strategy, content and a professional digital presence.",
  },
  {
    name: "Growth",
    detail: "Ongoing social, paid media, reporting and optimisation for businesses ready to scale.",
  },
  {
    name: "Performance",
    detail: "A fully customised retainer covering strategy, creative, advertising, web and analytics.",
  },
];

export default function PackagesPage() {
  return (
    <div className="px-5 py-16">
      <div className="mx-auto max-w-[1200px]">
        <span className="eyebrow">Packages</span>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.2rem)] leading-tight">
          Marketing retainers built around your goals
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[#cfcfcf]">
          Every business is different, and so is every marketing strategy. While our packages provide a clear starting point, many of our clients work with us on fully customised retainers designed around their specific goals, industry, and stage of growth.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {packages.map((item) => (
            <div key={item.name} className="card p-8">
              <h2 className="font-serif text-3xl">{item.name}</h2>
              <p className="mt-4 text-[#cfcfcf]">{item.detail}</p>
            </div>
          ))}
        </div>
        <Link href="/get-in-touch/" className="btn-pink mt-10">Talk To Us About A Retainer</Link>
      </div>
    </div>
  );
}
