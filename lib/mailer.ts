/**
 * Sends email through Resend (https://resend.com) when RESEND_API_KEY is set.
 * Without a key — e.g. in local development — emails are logged and kept in an in-memory
 * outbox that /api/dev/outbox shows, so flows can be tested without an email account.
 */

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface OutboxEntry extends Email {
  sentAt: string;
}

const globalOutbox = globalThis as unknown as { __outbox?: OutboxEntry[] };
export const devOutbox = (globalOutbox.__outbox ??= []);

export async function sendEmail(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    devOutbox.unshift({ ...email, sentAt: new Date().toISOString() });
    devOutbox.splice(20);
    console.log(`[mailer] No RESEND_API_KEY. Email to ${email.to}: "${email.subject}"`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Haulbook <reminders@haulbook.app>",
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Email provider error ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

/** Escapes text for use inside email HTML. */
export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function appUrl(path = "") {
  return `${(process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

/** Shared light layout for all emails. */
export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#231d3b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e3f3;border-radius:20px;padding:28px">
<tr><td style="font-size:15px;font-weight:700;letter-spacing:-0.02em;padding-bottom:18px">Haulbook</td></tr>
<tr><td style="font-size:22px;font-weight:700;letter-spacing:-0.03em;padding-bottom:12px">${esc(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.55">${body}</td></tr>
</table>
<p style="font-size:12px;color:#a9a3bf;margin-top:16px">You get this because you use Haulbook. <a href="${appUrl("/settings")}" style="color:#6d6787">Change email settings</a></p>
</td></tr></table></body></html>`;
}
