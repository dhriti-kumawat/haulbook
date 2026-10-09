import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { checkPhoneCode, phoneAuthAvailable, sendPhoneCode } from "@/lib/phoneAuth";
import { normalizePhone } from "@/lib/whatsapp";
import { NextRequest, NextResponse } from "next/server";

/**
 * Adds or changes the mobile number used for phone sign-in.
 * Step 1: { phone } sends a code by SMS. Step 2: { phone, code } saves the number.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!phoneAuthAvailable()) return NextResponse.json({ error: "Phone sign-in isn't available yet." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : null;
  if (!phone) return NextResponse.json({ error: "Enter your mobile number, like 98765 43210" }, { status: 400 });
  if (phone === user.phone) return NextResponse.json({ error: "That's already your number." }, { status: 400 });

  if (body.code === undefined) {
    if (!(await rateLimit(`add-phone:${user.id}`, 4, 60 * 60_000)) || !(await rateLimit(`phone-send:${phone}`, 4, 60 * 60_000))) {
      return NextResponse.json({ error: "Too many codes requested. Try again in an hour." }, { status: 429 });
    }
    const taken = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (taken) return NextResponse.json({ error: "That number is already used by another Haulbook account." }, { status: 409 });
    const sendError = await sendPhoneCode(phone);
    if (sendError) return NextResponse.json({ error: sendError }, { status: 502 });
    return NextResponse.json({ ok: true, sent: true, phone });
  }

  if (!(await rateLimit(`add-phone-check:${user.id}`, 8, 15 * 60_000))) {
    return NextResponse.json({ error: "Too many tries. Request a new code in a few minutes." }, { status: 429 });
  }
  if (!(await checkPhoneCode(phone, String(body.code)))) {
    return NextResponse.json({ error: "That code isn't right or has expired" }, { status: 400 });
  }
  try {
    await prisma.user.update({ where: { id: user.id }, data: { phone, phoneVerifiedAt: new Date() } });
  } catch {
    return NextResponse.json({ error: "That number is already used by another Haulbook account." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, phone });
}
