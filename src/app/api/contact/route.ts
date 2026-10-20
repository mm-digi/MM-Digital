import { NextResponse } from "next/server";
import { fieldsToEmail, sendEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Friendly labels for the field names used by the site's forms; anything not
// listed is still included under a tidied version of its own name
const LABELS: Record<string, string> = {
  name: "Name",
  "your-name": "Name",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  "your-email": "Email",
  phone: "Phone",
  "your-phone": "Phone",
  "your-services": "Services",
  "your-budget": "Project investment range",
  "your-timeline": "Desired start timeframe",
  "your-objective": "Main business goal this year",
  "your-ideal-client": "Ideal client or target audience",
  "your-growth-budget": "Growth investment comfort level",
  "your-assets": "Brand assets, app assets or analytics",
  message: "Message",
  "your-message": "Message",
};

const tidy = (key: string) =>
  key.replace(/^your-/, "").replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Please complete the form." }, { status: 400 });
  }

  const rows: [string, string][] = [];
  for (const [key, raw] of Object.entries(body as Record<string, unknown>)) {
    // Skip the old WordPress plugin's hidden bookkeeping fields
    if (key.startsWith("_")) continue;
    const value = (Array.isArray(raw) ? raw.join(", ") : String(raw ?? "")).trim();
    if (!value) continue;
    rows.push([LABELS[key] || tidy(key), value.slice(0, 5000)]);
  }

  const emailField = String(body.email || body["your-email"] || "").trim();
  const name =
    String(body.name || body["your-name"] || "").trim() ||
    `${body.firstName || ""} ${body.lastName || ""}`.trim();

  if (!rows.length) {
    return NextResponse.json({ error: "Please complete the form." }, { status: 400 });
  }

  const subject = `New enquiry from ${name || "the website"}`;
  const { html, text } = fieldsToEmail("New enquiry from mm-digi.co.uk", rows);

  try {
    const ok = await sendEmail({
      subject,
      html,
      text,
      replyTo: EMAIL_RE.test(emailField) ? emailField : undefined,
    });
    if (!ok) throw new Error("send failed");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "There has been some error while submitting the form. Please try again." },
      { status: 500 }
    );
  }
}
