import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/30">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-serif text-2xl">MM Digital</div>
          <p className="mt-4 max-w-md text-[#cfcfcf]">
            A digital marketing agency based in Exeter, serving clients across the UK & Europe.
          </p>
          <p className="mt-4 text-sm text-[#cfcfcf]">
            Admiral Way, Exeter, Devon, EX2 7GA
            <br />
            <a href="mailto:info@mm-digi.co.uk">info@mm-digi.co.uk</a>
            <br />
            <a href="tel:07880601123">07880 601123</a>
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Explore</div>
          <div className="flex flex-col gap-2 text-[#cfcfcf]">
            <Link href="/about-us/">About Us</Link>
            <Link href="/digital-services/">Digital Services</Link>
            <Link href="/our-work/">Our Work</Link>
            <Link href="/packages/">Packages</Link>
            <Link href="/blogs/">Blogs</Link>
            <Link href="/get-in-touch/">Get In Touch</Link>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-4">Clients</div>
          <div className="flex flex-col gap-2 text-[#cfcfcf]">
            <Link href="/login/">Client Login</Link>
            <Link href="/privacy-policy/">Privacy Policy</Link>
            <Link href="/cookie-policy/">Cookie Policy</Link>
            <a href="https://www.instagram.com/_mmdigital_/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.linkedin.com/company/mmdigi/posts/?feedView=all" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://www.facebook.com/p/MM-Digital-61556568016532/" target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-sm text-white/50">
        © {new Date().getFullYear()} MM Digital Marketing Limited. All rights reserved.
      </div>
    </footer>
  );
}
