// Sends site emails (enquiries, sign-up fallbacks) through Resend. Needs
// RESEND_API_KEY in Vercel, and the sending domain verified in Resend.
// RESEND_FROM and CONTACT_TO can override the defaults below.

const FROM = process.env.RESEND_FROM || "MM Digital Website <website@mm-digi.co.uk>";
const TO = process.env.CONTACT_TO || "info@mm-digi.co.uk";

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Renders label/value rows as a simple email-safe table plus a plain-text copy
export function fieldsToEmail(title: string, rows: [string, string][]) {
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:640px">
<h2 style="margin:0 0 16px;font-size:20px;color:#111">${escapeHtml(title)}</h2>
<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px">
${rows
  .map(
    ([k, v]) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;width:200px;vertical-align:top;color:#d9536a;font-weight:bold">${escapeHtml(k)}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
  )
  .join("\n")}
</table>
</div>`;
  const text = `${title}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  return { html, text };
}

export async function sendEmail({
  subject,
  html,
  text,
  replyTo,
}: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) {
    console.error("Resend send failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}
