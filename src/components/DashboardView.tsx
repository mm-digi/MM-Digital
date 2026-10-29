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
          <div className="mm-card space-y-4 p-8">
            <p className="text-[1.04rem] leading-7 text-[#cfcfcf]">
              Here’s your latest social media and website activity. We’re continuously working behind the scenes to grow your visibility, increase engagement and drive more visits across your channels and website.
            </p>
            <p className="text-[1.04rem] leading-7 text-[#cfcfcf]">
              Please note that this dashboard is designed to give you a quick, helpful snapshot of your performance. Figures shown here can sometimes be delayed or vary slightly, depending on when each platform and provider sends through their data, so numbers may not always reflect results in real time. Your full picture is always captured in your in-depth monthly report, where we review everything properly and highlight exactly what the data is telling us.
            </p>
            <p className="text-[1.04rem] leading-7 text-[#cfcfcf]">
              If you have any questions about the figures shown, or you would like clarity on anything, please do get in touch and we will always be happy to talk it through.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
