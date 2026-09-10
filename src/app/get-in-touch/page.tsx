import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Get In Touch" };

export default function ContactPage() {
  return (
    <div className="px-5 py-16">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow">Contact Us</span>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.2rem)] leading-tight">Contact Us</h1>
          <p className="mt-4 text-lg text-[#cfcfcf]">Got a project or need assistance?</p>
          <a href="tel:07880601123" className="btn-pink mt-6">Speak To us</a>
          <p className="mt-8 leading-7 text-[#cfcfcf]">
            What are you trying to achieve? What isn’t currently working? What would success look like? Tell us where you are now, where you want to go, and we’ll map out the most effective route to get there.
          </p>
          <div className="mt-10">
            <h2 className="font-serif text-2xl">What Happens Next?</h2>
            <p className="mt-3 text-[#cfcfcf]">
              We review your enquiry and assess alignment.<br />
              We arrange a short discovery call.<br />
              We provide a clear strategy outline and next steps.
            </p>
          </div>
        </div>
        <div className="card p-8">
          <h2 className="font-serif text-3xl">Get in Touch</h2>
          <p className="mt-3 mb-6 text-[#cfcfcf]">Let’s talk about how we can grow your business.</p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
