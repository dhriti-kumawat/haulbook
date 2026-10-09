import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { checkEmailCode, sendEmailCode } from "@/lib/emailCode";
import { NextRequest, NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Adds an email address to an account that has none (phone or Instagram sign-up), so reminders
 * can be emailed. Step 1: { email } sends a code. Step 2: { email, code } saves the address.
 * The address must be confirmed first: Google sign-in links by email, so an unconfirmed
 * address could hand someone else's Google login this account.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (user.email) return NextResponse.json({ error: "Your account already has an email address." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ error: "Enter an email address, like you@example.com" }, { status: 400 });

  if (body.code === undefined) {
    if (!(await rateLimit(`add-email:${user.id}`, 5, 60 * 60_000))) {
      return NextResponse.json({ error: "Too many codes requested. Try again in an hour." }, { status: 429 });
    }
    const taken = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (taken) return NextResponse.json({ error: "That email already has a Haulbook account. Sign in with it instead." }, { status: 409 });
    try {
      await sendEmailCode(user.id, email);
    } catch {
      return NextResponse.json({ error: "Couldn't send the email. Try again later." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sent: true });
  }

  if (!(await rateLimit(`add-email-check:${user.id}`, 8, 15 * 60_000))) {
    return NextResponse.json({ error: "Too many tries. Request a new code in a few minutes." }, { status: 429 });
  }
  if (!(await checkEmailCode(user.id, email, String(body.code)))) {
    return NextResponse.json({ error: "That code isn't right or has expired" }, { status: 400 });
  }
  try {
    await prisma.user.update({ where: { id: user.id }, data: { email, emailVerified: new Date() } });
  } catch {
    return NextResponse.json({ error: "That email already has a Haulbook account." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, email });
}
