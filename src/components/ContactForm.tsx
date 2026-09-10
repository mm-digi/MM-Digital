"use client";

import { FormEvent, useState } from "react";

export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    setStatus(res.ok ? "ok" : "error");
    if (res.ok) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {compact ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="site-input" name="firstName" placeholder="First Name" required />
            <input className="site-input" name="lastName" placeholder="Last Name" required />
          </div>
          <input className="site-input" type="email" name="email" placeholder="Email" required />
          <textarea className="site-textarea" name="message" rows={5} placeholder="Message" required />
        </>
      ) : (
        <>
          <input className="site-input" name="name" placeholder="Full Name" required />
          <input className="site-input" type="email" name="email" placeholder="Email Address" required />
          <input className="site-input" name="phone" placeholder="Phone Number" />
          <textarea className="site-textarea" name="message" rows={6} placeholder="What are you trying to achieve?" required />
        </>
      )}
      <button className="btn-pink w-fit" disabled={loading}>
        {loading ? "Sending..." : "Submit"}
      </button>
      {status === "ok" && <p className="text-emerald-400">The form has been submitted successfully!</p>}
      {status === "error" && (
        <p className="text-red-400">There has been some error while submitting the form. Please verify all form fields again.</p>
      )}
    </form>
  );
}
