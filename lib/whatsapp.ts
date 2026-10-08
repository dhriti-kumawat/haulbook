/**
 * WhatsApp reminders through Meta's WhatsApp Cloud API.
 *
 * Off until these are set (see docs/LAUNCH.md):
 *   WHATSAPP_TOKEN            permanent access token for the WhatsApp Business account
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's ID
 *   WHATSAPP_TEMPLATE         an approved template with one body parameter (default "haulbook_digest")
 *   WHATSAPP_TEMPLATE_LANG    its language code (default "en")
 * Business-initiated messages must use an approved template, so the digest text goes in its {{1}}.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Indian mobile numbers as E.164 (+91XXXXXXXXXX); other countries if given with +country code. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+\d{10,15}$/.test(digits)) return digits;
  const bare = digits.replace(/^\+/, "").replace(/^0/, "");
  if (/^[6-9]\d{9}$/.test(bare)) return `+91${bare}`;
  if (/^91[6-9]\d{9}$/.test(bare)) return `+${bare}`;
  return null;
}

/** Sends the daily digest. Returns false when WhatsApp isn't set up or Meta refuses. */
export async function sendWhatsApp(to: string, text: string): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  // Template parameters can't contain newlines or long runs of spaces.
  const param = text.replace(/\s*\n+\s*/g, " · ").replace(/\s{2,}/g, " ").slice(0, 900);
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE || "haulbook_digest",
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: param }] }],
      },
    }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!res?.ok) {
    console.error("WhatsApp send failed:", res?.status, await res?.text().catch(() => ""));
    return false;
  }
  return true;
}
