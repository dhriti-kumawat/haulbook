import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { buildDigest, renderDigest, renderPushDigest } from "@/lib/digest";
import { sendPush } from "@/lib/push";
import { sendEmail } from "@/lib/mailer";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Daily reminder run. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`
 * (see vercel.json). Each user gets at most one digest per day: by email if email reminders are on,
 * and as a notification on every device they turned notifications on for.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const given = Buffer.from(req.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    // Constant-time compare, so the secret can't be guessed from response timing.
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: startOfToday } }] },
        { OR: [{ remindersEnabled: true, email: { not: null } }, { pushSubscriptions: { some: {} } }] },
      ],
    },
    select: { id: true, email: true, name: true, reminderDaysBefore: true, remindersEnabled: true, _count: { select: { pushSubscriptions: true } } },
  });

  let sent = 0;
  let pushed = 0;
  let failed = 0;
  for (const user of users) {
    const products = await prisma.product.findMany({ where: { userId: user.id, isSample: false } });
    const { lines, shouldSend } = buildDigest(products.map((p) => productView(p, now)), user.reminderDaysBefore, now);
    if (!shouldSend) continue;
    let delivered = false;
    if (user.remindersEnabled && user.email) {
      try {
        await sendEmail({ to: user.email, ...renderDigest(user.name, lines) });
        delivered = true;
        sent++;
      } catch (e) {
        failed++;
        console.error(`Reminder email failed for user ${user.id}:`, e);
      }
    }
    if (user._count.pushSubscriptions) {
      const result = await sendPush(user.id, { ...renderPushDigest(lines), url: "/home", tag: "haulbook-digest" });
      if (result.sent) {
        delivered = true;
        pushed++;
      }
    }
    if (delivered) await prisma.user.update({ where: { id: user.id }, data: { lastDigestAt: now } });
  }
  return NextResponse.json({ checked: users.length, sent, pushed, failed });
}
