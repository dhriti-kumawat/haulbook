import { devOutbox, esc } from "@/lib/mailer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Development only: shows emails that would have been sent, since there is no email key locally. */
export async function GET() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const list = devOutbox
    .map(
      (m, i) => `<details ${i === 0 ? "open" : ""} style="margin:0 0 16px;border:1px solid #ddd;border-radius:12px;padding:12px 16px;background:#fff">
<summary style="cursor:pointer"><b>${esc(m.subject)}</b> → ${esc(m.to)} <span style="color:#888">${esc(m.sentAt)}</span></summary>
<iframe srcdoc="${esc(m.html)}" style="width:100%;height:560px;border:0;margin-top:12px"></iframe></details>`
    )
    .join("");
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Dev outbox</title><body style="font-family:system-ui;background:#f4f1fa;padding:24px;max-width:760px;margin:auto">
<h1 style="font-size:20px">Dev outbox <small style="color:#888;font-weight:400">(${devOutbox.length}, newest first)</small></h1>
${list || "<p>No emails yet.</p>"}</body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
