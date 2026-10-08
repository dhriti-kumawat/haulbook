import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { buildDigest, renderDigest } from "@/lib/digest";
import { emailLayout, sendEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

/** Sends the signed-in user a reminder email now, so they can see what it looks like. */
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user.email) return NextResponse.json({ error: "Your account has no email address" }, { status: 400 });
  if (!(await rateLimit(`test-digest:${user.id}`, 3, 60 * 60_000))) {
    return NextResponse.json({ error: "You can send 3 test emails an hour. Try again later." }, { status: 429 });
  }

  const products = await prisma.product.findMany({ where: { userId: user.id } });
  const { lines } = buildDigest(products.map((p) => productView(p)), user.reminderDaysBefore);
  const email = lines.length
    ? renderDigest(user.name, lines)
    : {
        subject: "Nothing due right now",
        html: emailLayout("You're all caught up", "<p>Nothing is due in the next few days. We'll email you when something is.</p>"),
        text: "You're all caught up. Nothing is due in the next few days.",
      };
  try {
    await sendEmail({ to: user.email, ...email });
  } catch (e) {
    console.error("Test reminder failed:", e);
    return NextResponse.json({ error: "Couldn't send the email. Try again later." }, { status: 502 });
  }
  return NextResponse.json({ sent: true, items: lines.length, delivered: Boolean(process.env.RESEND_API_KEY) });
}
