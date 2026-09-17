"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupabaseLoginTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Not signed in");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Signed in successfully as ${data.user.email || data.user.id}.`);
    }
    setLoading(false);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMessage("Signed out");
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
            Test email
            <input className="site-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
        <button className="mt-4 text-sm underline" type="button" onClick={signOut}>Sign out</button>
      </div>
    </main>
  );
}
