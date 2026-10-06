"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Loads the site in a hidden same-origin frame so Vercel's checkpoint can run
// its browser check and set its clearance cookie, retrying the login request
// until it gets through (or about 15 seconds pass).
async function retryAfterCheckpoint(
  attempt: () => Promise<Response>,
  isChallenge: (r: Response) => boolean
) {
  const frame = document.createElement("iframe");
  frame.src = "/login/?checkpoint=1";
  frame.style.display = "none";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);
  try {
    let res = await attempt();
    for (let i = 0; i < 10 && isChallenge(res); i++) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await attempt();
    }
    return res;
  } finally {
    frame.remove();
  }
}

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
    const body = JSON.stringify({
      username: form.get("username"),
      password: form.get("password"),
      remember: form.get("remember") === "on",
    });
    const attempt = () =>
      fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    const isChallenge = (r: Response) =>
      !(r.headers.get("content-type") || "").includes("application/json");
    try {
      let res = await attempt();
      if (isChallenge(res)) {
        // Vercel's security checkpoint intercepted the request. Reloading the
        // page used to clear it but also wiped what the client had typed, so
        // they had to sign in twice. Instead, let the checkpoint run in a
        // hidden frame and retry with the same details once it has passed.
        setError("Verifying your browser, one moment...");
        res = await retryAfterCheckpoint(attempt, isChallenge);
        setError("");
        if (isChallenge(res)) {
          setError("The site is still verifying your browser. Please wait a few seconds and press Log In again.");
          return;
        }
      }
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
    <div className="px-5 py-10 sm:py-24">
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
