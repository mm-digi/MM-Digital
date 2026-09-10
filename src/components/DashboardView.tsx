import type { ClientDashboard } from "@/lib/clients";

export default function DashboardView({ dashboard }: { dashboard: ClientDashboard }) {
  return (
    <div>
      <section className="px-6 pb-10 pt-20">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="border-l-2 border-[#ff808b] pl-7">
            <span className="eyebrow mb-2 block">Live Updates</span>
            <h1 className="font-serif text-[clamp(1.8rem,3.5vw,3rem)] leading-[1.05]">
              {dashboard.heading}
            </h1>
            <p className="mt-4 max-w-xl text-[1.08rem] leading-7 text-[#cfcfcf]">
              Your live marketing performance, ad activity and social updates all in one place.
            </p>
            <a href="tel:07880601123" className="btn-pink mt-6">
              Speak To Us
            </a>
          </div>
          <div className="card p-8">
            <p className="text-[1.04rem] leading-7 text-[#cfcfcf]">
              Here’s your latest social media and website activity. We’re continuously working behind the scenes to grow your visibility, increase engagement and drive more visits across your channels and website.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-[1600px]">
          <div className="mx-auto mb-8 max-w-[760px] text-center">
            <span className="eyebrow mb-2 block">Live Data</span>
            <h2 className="font-serif text-[clamp(1.5rem,3vw,2.4rem)] leading-tight">
              {dashboard.reportTitle}
            </h2>
            <p className="mt-3 text-[#cfcfcf]">
              View live website traffic, engagement and performance data from Google, Facebook, Instagram and LinkedIn.
            </p>
          </div>
          <div className="mm-live-report-card overflow-hidden">
            <iframe
              className="mm-live-report-frame"
              src={dashboard.embedUrl}
              title={`${dashboard.name} analytics`}
              width="100%"
              height="1200"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
