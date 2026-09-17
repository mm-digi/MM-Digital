"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupabaseLoginTestPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Not signed in");
  const [accessSummary, setAccessSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const loginEmail = usernameOrEmail.includes("@") ? usernameOrEmail.trim() : `${usernameOrEmail.trim().toLowerCase()}@clients.mm-digi.co.uk`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Signed in successfully as ${data.user.email || data.user.id}.`);
      const profile = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      const access = await supabase
        .from("client_dashboard_access")
        .select("client_id")
        .eq("user_id", data.user.id);

      if (profile.error || access.error) {
        setAccessSummary([profile.error?.message || access.error?.message || "Could not read protected data."]);
      } else if (!access.data.length) {
        setAccessSummary([`Profile: ${profile.data?.display_name || "missing"}`, "No dashboard access rows found."]);
      } else {
        const clientIds = access.data.map((row) => row.client_id);
        const clients = await supabase
          .from("clients")
          .select("id, name, slug")
          .in("id", clientIds);
        const dashboards = await supabase
          .from("client_dashboards")
          .select("client_id, name")
          .in("client_id", clientIds);
        if (clients.error || dashboards.error) {
          setAccessSummary([clients.error?.message || dashboards.error?.message || "Could not read assigned records."]);
        } else {
          setAccessSummary([
            `Profile: ${profile.data?.display_name || "missing"}`,
            ...clients.data.map((client) => {
              const names = dashboards.data
                .filter((dashboard) => dashboard.client_id === client.id)
                .map((dashboard) => dashboard.name)
                .join(", ");
              return `Access: ${client.name} (${client.slug})${names ? ` — ${names}` : ""}`;
            }),
          ]);
        }
      }
    }
    setLoading(false);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMessage("Signed out");
    setAccessSummary([]);
  }

  return (
    <main className="px-5 py-24">
      <div className="card mx-auto max-w-md p-8">
        <span className="eyebrow">Supabase Test</span>
        <h1 className="mt-3 font-serif text-4xl">Test Login</h1>
        <p className="mt-3 text-[#cfcfcf]">
          This is a private staging test and does not replace the live client login.
        </p>
        <form onSubmit={signIn} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm">
            Existing client username
            <input className="site-input" type="text" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} placeholder="e.g. auric-performance" autoComplete="username" required />
          </label>
          <label className="grid gap-2 text-sm">
            Test password
            <input className="site-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn-pink" disabled={loading}>
            {loading ? "Signing in..." : "Test Supabase Login"}
          </button>
        </form>
        <p className="mt-5 text-sm text-[#cfcfcf]" aria-live="polite">{message}</p>
        {accessSummary.length > 0 && (
          <div className="mt-4 rounded border border-white/15 p-3 text-sm text-[#cfcfcf]">
            {accessSummary.map((item) => <p key={item}>{item}</p>)}
          </div>
        )}
        <button className="mt-4 text-sm underline" type="button" onClick={signOut}>Sign out</button>
      </div>
    </main>
  );
}
