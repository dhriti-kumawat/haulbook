import { clientIp, rateLimit } from "@/lib/rateLimit";
import { phoneAuthAvailable, sendPhoneCode } from "@/lib/phoneAuth";
import { normalizePhone } from "@/lib/whatsapp";
import { NextRequest, NextResponse } from "next/server";

/** Sends a sign-in code by SMS. Same answer whether or not the number has an account. */
export async function POST(req: NextRequest) {
  if (!phoneAuthAvailable()) return NextResponse.json({ error: "Phone sign-in isn't available yet." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : null;
  if (!phone) return NextResponse.json({ error: "Enter your mobile number, like 98765 43210" }, { status: 400 });

  // SMS costs money: limit per network and per number.
  const ip = clientIp(req.headers);
  if (!(await rateLimit(`phone-send-ip:${ip}`, 10, 60 * 60_000)) || !(await rateLimit(`phone-send:${phone}`, 4, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many codes requested. Try again in a while." }, { status: 429 });
  }
  const error = await sendPhoneCode(phone);
  if (error) return NextResponse.json({ error }, { status: 502 });
  return NextResponse.json({ ok: true, phone });
}
