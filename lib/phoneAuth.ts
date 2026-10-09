import { createHash, randomInt } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Sign-in codes by SMS, through Twilio Verify (it sends and checks the code; works in India
 * without your own DLT registration). Off until TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and
 * TWILIO_VERIFY_SID are set. In local development without them, codes are printed in the
 * server log instead, so the flow can be tried.
 */
const twilioReady = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SID);
const devMode = () => process.env.NODE_ENV !== "production" && !twilioReady();
export const phoneAuthAvailable = () => twilioReady() || devMode();

const api = (path: string, body: Record<string, string>) =>
  fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SID}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(15_000),
  });

// Development only: codes kept in memory.
const devCodes = (globalThis as unknown as { __devCodes?: Map<string, { hash: string; expires: number }> }).__devCodes ??= new Map();
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Sends a 6-digit code to the number. Returns an error message, or null when sent. */
export async function sendPhoneCode(phone: string): Promise<string | null> {
  if (devMode()) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    devCodes.set(phone, { hash: sha(code), expires: Date.now() + 10 * 60_000 });
    console.log(`[phone-auth] Development code for ${phone}: ${code}`);
    return null;
  }
  const res = await api("Verifications", { To: phone, Channel: "sms" }).catch(() => null);
  if (!res?.ok) {
    console.error("Twilio send failed:", res?.status, await res?.text().catch(() => ""));
    return "Couldn't send a code to that number. Check it and try again.";
  }
  return null;
}

/** Checks the code the person typed. */
export async function checkPhoneCode(phone: string, code: string): Promise<boolean> {
  if (!/^\d{4,8}$/.test(code)) return false;
  if (devMode()) {
    const entry = devCodes.get(phone);
    const ok = Boolean(entry && entry.expires > Date.now() && entry.hash === sha(code));
    if (ok) devCodes.delete(phone);
    return ok;
  }
  const res = await api("VerificationCheck", { To: phone, Code: code }).catch(() => null);
  if (!res?.ok) return false;
  const data = (await res.json().catch(() => null)) as { status?: string } | null;
  return data?.status === "approved";
}

/** The account for a verified number: an existing one, or a new one. */
export async function userForPhone(phone: string) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return existing;
  return prisma.user.create({ data: { phone, phoneVerifiedAt: new Date(), name: null } });
}
