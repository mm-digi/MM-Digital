import Link from "next/link";
import Marquee from "@/components/Marquee";
import ContactForm from "@/components/ContactForm";
import { CLIENT_LOGOS, PARTNER_LOGOS, SERVICES, TESTIMONIALS } from "@/lib/content";

export default function Home() {
  return (
    <div>
      <section className="px-5 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-serif text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.95]">
            From Concept To Conversion
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#cfcfcf]">
            We help ambitious brands scale through strategy, design and performance marketing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="tel:07880601123" className="btn-pink">Book A Free Strategy Call</a>
            <Link href="/our-work/" className="btn-ghost">View Our Work</Link>
          </div>
          <p className="mt-8 text-sm tracking-wide text-white/70">
            £1.6M+ revenue generated • Trusted by 25+ brands • 9.5K leads delivered
          </p>
        </div>
      </section>

      <section className="py-6">
        <div className="mb-4 text-center">
          <h2 className="font-serif text-3xl">Trusted by Leading Brands</h2>
        </div>
        <Marquee items={CLIENT_LOGOS} />
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Meet MM Digital</span>
            <h2 className="mt-3 font-serif text-[clamp(2rem,4vw,3.4rem)] leading-tight">
              Measurable Growth For Ambitious Brands
            </h2>
            <p className="mt-4 text-[#cfcfcf]">
              We are a digital marketing agency based in Exeter, serving clients across the UK & Europe.
            </p>
            <Link href="/get-in-touch/" className="btn-pink mt-6">Get In Touch</Link>
          </div>
          <div className="card p-8 text-[#cfcfcf] leading-7">
            <p>
              At MM Digital, we work alongside ambitious businesses to strengthen their digital presence and turn it into a genuine, lasting growth asset. We deliver full-service digital marketing that goes beyond activity and focuses entirely on what actually moves the needle. Real strategy, real creativity and real results.
            </p>
            <p className="mt-4">
              Our work spans social media, paid advertising, SEO, websites, email, LinkedIn outreach, brand identity, content, app design and AI-powered marketing automation.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="text-center">
          <span className="eyebrow">Trusted Tech Partners</span>
          <h2 className="mt-3 font-serif text-3xl md:text-5xl">Working With Industry<br />Leading Brands</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#cfcfcf]">
            We use the most powerful platforms in digital marketing to deliver exceptional results for every client we work with.
          </p>
        </div>
        <Marquee items={PARTNER_LOGOS} height={42} />
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow">What We Do</span>
              <h2 className="mt-3 font-serif text-[clamp(2rem,4vw,3.2rem)]">Marketing Services Built For Growth</h2>
            </div>
            <Link href="/digital-services/" className="btn-pink">Discover More</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((service) => (
              <Link key={service.title} href={service.href} className="card p-7 transition hover:-translate-y-1">
                <img src={service.icon} alt="" className="mb-5 h-14 w-14 object-contain" />
                <h3 className="font-serif text-2xl">{service.title}</h3>
                <p className="mt-3 text-[#cfcfcf]">{service.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-[1100px] text-center">
          <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] leading-tight">
            Hear it From The People Who Know Us Best
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {TESTIMONIALS.slice(0, 6).map((item) => (
              <blockquote key={item.name} className="card p-7 text-left">
                <p className="text-[#cfcfcf]">“{item.quote}”</p>
                <footer className="mt-5 font-bold text-[#ff808b]">
                  {item.name} – {item.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-[1400px] gap-5 md:grid-cols-3">
          {[
            ["Our Mission", "At MM Digital, we don’t just follow trends, we set them. Our mission is to propel businesses forward with innovative, data-driven digital strategies."],
            ["Our Vision", "We envision a world where brands thrive in the digital age. We empower businesses with transformative marketing strategies that push boundaries."],
            ["Our Values", "Innovation, collaboration, and results define us. We build lasting partnerships rooted in trust and a commitment to delivering exceptional value."],
          ].map(([title, text]) => (
            <div key={title} className="card p-8">
              <h3 className="font-serif text-2xl">{title}</h3>
              <p className="mt-4 text-[#cfcfcf]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-center font-serif text-3xl">Results That Speak For Themselves</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              ["2025 Portfolio Results", ["£1.6M+", "Generated Revenue"], ["25+", "Active Clients"], ["9.5K+", "Leads Generated"]],
              ["2026 Portfolio Results", ["Growing", "Generated Revenue"], ["25+", "Active Clients"], ["Rising", "Qualified Leads"]],
            ].map(([title, ...stats]) => (
              <div key={String(title)} className="card p-8">
                <h3 className="font-serif text-2xl">{title as string}</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {(stats as string[][]).map(([value, label]) => (
                    <div key={label}>
                      <div className="text-3xl font-bold text-[#ff808b]">{value}</div>
                      <div className="mt-1 text-sm text-[#cfcfcf]">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Get in Touch</span>
            <h2 className="mt-3 font-serif text-4xl">See how we’d drive results for you</h2>
            <p className="mt-4 text-[#cfcfcf]">
              Discover how MM Digital’s expert strategies can elevate your online presence. Join us now to start transforming your brand with data-driven creativity and personalized marketing solutions.
            </p>
            <Link href="/digital-services/" className="btn-pink mt-6">Discover Our Services</Link>
          </div>
          <div className="card p-8">
            <ContactForm compact />
          </div>
        </div>
      </section>
    </div>
  );
}
