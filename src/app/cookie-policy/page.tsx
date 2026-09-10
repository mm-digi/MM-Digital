import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiePage() {
  return (
    <div className="px-5 py-16">
      <article className="mx-auto max-w-3xl leading-7 text-[#cfcfcf]">
        <h1 className="font-serif text-5xl text-white">Cookie Policy</h1>
        <p className="mt-6">
          We use essential cookies to keep client dashboards secure and remember login sessions. Analytics cookies help us understand how the public website is used so we can improve it.
        </p>
        <p className="mt-4">
          You can control cookies in your browser settings. Blocking essential cookies may prevent client login from working.
        </p>
      </article>
    </div>
  );
}
