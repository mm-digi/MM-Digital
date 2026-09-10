"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(params.get("error") === "forbidden" ? "This dashboard belongs to another account." : "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
        remember: form.get("remember") === "on",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Invalid username or password.");
      return;
    }
    router.push(params.get("redirect") || data.redirect || "/");
    router.refresh();
  }

  return (
    <div className="px-5 py-24">
      <div className="mx-auto max-w-md card p-8">
        <span className="eyebrow">Client Access</span>
        <h1 className="mt-3 font-serif text-4xl">Login</h1>
        <p className="mt-3 text-[#cfcfcf]">Sign in to view your live analytics dashboard.</p>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm">
            Username or E-mail
            <input className="site-input" name="username" autoComplete="username" required />
          </label>
          <label className="grid gap-2 text-sm">
            Password
            <input className="site-input" type="password" name="password" autoComplete="current-password" required />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#cfcfcf]">
            <input type="checkbox" name="remember" />
            Keep me signed in
          </label>
          {error && <p className="text-red-400">{error}</p>}
          <button className="btn-pink" disabled={loading}>
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
