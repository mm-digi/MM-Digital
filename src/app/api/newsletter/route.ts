import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { fieldsToEmail, sendEmail } from "@/lib/email";

// Adds newsletter sign-ups to the Mailchimp audience. Needs MAILCHIMP_API_KEY
// (ends in the data centre, e.g. "-us21") and MAILCHIMP_AUDIENCE_ID in Vercel.
// If Mailchimp isn't configured or fails, the sign-up is emailed to info@
// instead so it isn't lost.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function addToMailchimp(email: string) {
  const key = process.env.MAILCHIMP_API_KEY;
  const audience = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!key || !audience) return false;

  const dc = key.split("-")[1];
  if (!dc) return false;

  const base = `https://${dc}.api.mailchimp.com/3.0/lists/${audience}/members/${createHash("md5").update(email).digest("hex")}`;
  const headers = {
    Authorization: `Basic ${Buffer.from(`mm:${key}`).toString("base64")}`,
    "Content-Type": "application/json",
  };

  // PUT creates the contact or leaves an existing one as it is, so signing up
  // twice is harmless and anyone who unsubscribed isn't silently re-added.
  const res = await fetch(base, {
    method: "PUT",
    headers,
    body: JSON.stringify({ email_address: email, status_if_new: "subscribed" }),
  });
  if (!res.ok) {
    console.error("Mailchimp sign-up failed", res.status, await res.text().catch(() => ""));
    return false;
  }

  await fetch(`${base}/tags`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tags: [{ name: "Website sign-up", status: "active" }] }),
  }).catch(() => undefined);

  return true;
}

async function emailFallback(email: string) {
  const { html, text } = fieldsToEmail("New newsletter sign-up (not added to Mailchimp)", [["Email", email]]);
  return sendEmail({ subject: "New newsletter sign-up from mm-digi.co.uk", html, text, replyTo: email });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    if ((await addToMailchimp(email)) || (await emailFallback(email))) {
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error("Newsletter sign-up error", err);
  }
  return NextResponse.json(
    { error: "There has been some error while signing you up. Please try again." },
    { status: 500 }
  );
}
