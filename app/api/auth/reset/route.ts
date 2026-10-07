import { prisma } from "@/lib/prisma";
import { hashToken, MIN_PASSWORD } from "@/lib/passwordReset";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!rateLimit(`reset-ip:${clientIp(req.headers)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Password needs at least ${MIN_PASSWORD} characters` }, { status: 400 });
  }

  const record = token ? await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link has expired or was already used. Ask for a new one." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: await bcrypt.hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Any other open links for this account stop working too.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null, id: { not: record.id } } }),
  ]);
  return NextResponse.json({ ok: true });
}
