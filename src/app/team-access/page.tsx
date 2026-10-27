import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CLIENT_DASHBOARDS } from "@/lib/clients";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team access",
  robots: { index: false, follow: false },
};

export default async function TeamAccessPage() {
  const session = await getSession();
  if (!session) redirect("/login/?redirect=/team-access/");
  if (session.role !== "staff") redirect(`/${session.slug}/`);

  const clients = [...CLIENT_DASHBOARDS].sort((a, b) => a.name.localeCompare(b.name, "en-GB"));

  return (
    <div className="px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl mm-card p-8">
        <span className="eyebrow">Team</span>
        <h1 className="mt-3 font-serif text-4xl">Client dashboards</h1>
        <p className="mt-3 text-[#cfcfcf]">Signed in as {session.username}. Choose a client.</p>
        <ul className="mt-8 grid list-none gap-2 p-0">
          {clients.map((client) => (
            <li key={client.slug}>
              <a className="block border border-white/15 px-4 py-3 text-white hover:border-[#ff808b]" href={`/${client.slug}/`}>
                {client.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
