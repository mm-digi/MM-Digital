import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="px-5 py-16">
      <article className="mx-auto max-w-3xl leading-7 text-[#cfcfcf]">
        <h1 className="font-serif text-5xl text-white">Privacy Policy</h1>
        <p className="mt-6">
          MM Digital Marketing Limited is a company registered in England and Wales. We collect and use personal information to respond to enquiries, deliver services and operate client dashboards.
        </p>
        <p className="mt-4">
          By registering with, accessing, or using this website, you agree to be bound by these terms. Account holders are responsible for keeping usernames and passwords confidential and must notify us immediately of any unauthorised use.
        </p>
        <p className="mt-4">
          For privacy questions, contact <a href="mailto:info@mm-digi.co.uk">info@mm-digi.co.uk</a>.
        </p>
      </article>
    </div>
  );
}
