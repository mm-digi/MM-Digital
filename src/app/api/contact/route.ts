import { NextResponse } from "next/server";

import { Resend } from "resend";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Please complete the form." }, { status: 400 });
  }

  const payload = {
    name: body.name || `${body.firstName || ""} ${body.lastName || ""}`.trim(),
    email: body.email,
    phone: body.phone,
    message: body.message,
    extra: body,
    _subject: "New enquiry from mm-digi.co.uk",
  };

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "MM Digital <hello@mm-digi.co.uk>",
      to: process.env.CONTACT_TO_EMAIL || "info@mm-digi.co.uk",
      replyTo: payload.email || undefined,
      subject: "New enquiry from mm-digi.co.uk",
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email || "Not provided"}`,
        `Phone: ${payload.phone || "Not provided"}`,
        "",
        payload.message || "No message provided",
      ].join("\n"),
      html: `
        <h2>New enquiry from mm-digi.co.uk</h2>
        <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email || "Not provided")}</p>
        <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(payload.message || "No message provided").replaceAll("\n", "<br>")}</p>
      `,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "There has been some error while submitting the form. Please try again." },
      { status: 500 }
    );
  }
}
