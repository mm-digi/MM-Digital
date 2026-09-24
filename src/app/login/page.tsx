"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const initialError =
    params.get("error") === "forbidden"
      ? "This dashboard belongs to another account."
      : params.get("error") || "";
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          remember: form.get("remember") === "on",
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const key = "mm-login-challenge";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
          return;
        }
        setError("The site is verifying your browser. Wait for that check to finish, then sign in again.");
        return;
      }
      sessionStorage.removeItem("mm-login-challenge");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        return;
      }
      window.location.assign(params.get("redirect") || data.redirect || "/");
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 py-24">
      <div className="mx-auto max-w-md mm-card p-8">
        <span className="eyebrow">Client Access</span>
        <h1 className="mt-3 font-serif text-4xl">Login</h1>
        <p className="mt-3 text-[#cfcfcf]">Sign in to view your live analytics dashboard.</p>
        <form onSubmit={onSubmit} action="/api/login/" method="post" className="mt-8 grid gap-4">
          <input type="hidden" name="redirect" value={params.get("redirect") || ""} />
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
