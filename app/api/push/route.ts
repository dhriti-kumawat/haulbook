import { prisma } from "@/lib/prisma";
import { pushConfigured } from "@/lib/push";
import { requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

/** Saves this device's push subscription for the signed-in user. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!pushConfigured()) return NextResponse.json({ error: "Notifications aren't set up on this server yet." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (
    typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || endpoint.length > 1000 ||
    typeof p256dh !== "string" || p256dh.length > 200 || typeof auth !== "string" || auth.length > 100
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  const device = typeof body?.device === "string" ? body.device.slice(0, 80) : null;

  // The same browser re-subscribing (or switching accounts) replaces its old row.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, device, userId: user.id },
    update: { p256dh, auth, device, userId: user.id },
  });
  const count = await prisma.pushSubscription.count({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, devices: count });
}

/** Turns notifications off for one device. */
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: user.id } });
  return NextResponse.json({ ok: true });
}
