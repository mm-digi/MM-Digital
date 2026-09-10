import { NextResponse } from "next/server";

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
    const res = await fetch("https://formsubmit.co/ajax/info@mm-digi.co.uk", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("formsubmit failed");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "There has been some error while submitting the form. Please try again." },
      { status: 500 }
    );
  }
}
