import { prisma } from "@/lib/prisma";
import { appUrl, emailLayout, esc, sendEmail } from "@/lib/mailer";
import { newResetToken, RESET_TTL_MS } from "@/lib/passwordReset";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

// Same answer whether or not the account exists, so the form can't be used to find accounts.
const GENERIC = { ok: true, message: "If that email has an account, a reset link is on its way." };

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`forgot-ip:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@") || email.length > 200) {
    return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
  }
  if (!rateLimit(`forgot-email:${email}`, 3, 60 * 60_000)) return NextResponse.json(GENERIC);

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user?.email) return NextResponse.json(GENERIC);

  try {
    if (!user.password) {
      await sendEmail({
        to: user.email,
        subject: "Signing in to Haulbook",
        html: emailLayout("You sign in with Google", `<p>Your Haulbook account uses Google sign-in, so there's no password to reset.</p><p><a href="${appUrl("/auth/signin")}">Sign in with Google</a></p>`),
        text: `Your Haulbook account uses Google sign-in, so there's no password to reset. Sign in: ${appUrl("/auth/signin")}`,
      });
      return NextResponse.json(GENERIC);
    }

    const { token, tokenHash } = newResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });
    const link = appUrl(`/auth/reset?token=${token}`);
    await sendEmail({
      to: user.email,
      subject: "Reset your Haulbook password",
      html: emailLayout(
        "Reset your password",
        `<p>Someone asked to reset the password for ${esc(user.email)}. If that was you, choose a new one:</p>
<p style="margin:22px 0"><a href="${link}" style="display:inline-block;background:#231d3b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">Choose a new password</a></p>
<p style="color:#6d6787;font-size:13px">The link works once and expires in 1 hour. If you didn't ask for this, ignore this email; your password stays the same.</p>`
      ),
      text: `Reset your Haulbook password: ${link}\n\nThe link works once and expires in 1 hour. If you didn't ask for this, ignore this email.`,
    });
  } catch (e) {
    console.error("Password reset email failed:", e);
  }
  return NextResponse.json(GENERIC);
}
