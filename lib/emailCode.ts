import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { emailLayout, sendEmail } from "./mailer";

/**
 * 6-digit codes that prove someone owns an email address before it is added to their account.
 * Stored hashed in the VerificationToken table, one live code per user, valid for 15 minutes.
 */
const ident = (userId: string) => `add-email:${userId}`;
const hash = (userId: string, email: string, code: string) => createHash("sha256").update(`${userId}:${email}:${code}`).digest("hex");

export async function sendEmailCode(userId: string, email: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.verificationToken.deleteMany({ where: { identifier: ident(userId) } });
  await prisma.verificationToken.create({ data: { identifier: ident(userId), token: hash(userId, email, code), expires: new Date(Date.now() + 15 * 60_000) } });
  await sendEmail({
    to: email,
    subject: `${code} is your Haulbook code`,
    html: emailLayout("Confirm your email", `<p>Enter this code in Haulbook to add this address to your account:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p style="color:#6b6487">It works for 15 minutes. If you didn't ask for it, ignore this email.</p>`),
    text: `Your Haulbook code is ${code}. It works for 15 minutes. If you didn't ask for it, ignore this email.`,
  });
}

/** True when the code matches; the code is used up either way once it matches. */
export async function checkEmailCode(userId: string, email: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const row = await prisma.verificationToken.findFirst({ where: { identifier: ident(userId), expires: { gt: new Date() } } });
  if (!row) return false;
  const a = Buffer.from(row.token), b = Buffer.from(hash(userId, email, code));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  await prisma.verificationToken.deleteMany({ where: { identifier: ident(userId) } });
  return true;
}
