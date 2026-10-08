import { prisma } from "@/lib/prisma";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { requireUser } from "@/lib/session";
import { normalizePhone, whatsappConfigured } from "@/lib/whatsapp";
import { NextRequest, NextResponse } from "next/server";

const view = (u: { whatsappNumber: string | null; whatsappOptInAt: Date | null }) => ({
  available: whatsappConfigured(),
  number: u.whatsappNumber,
  on: Boolean(u.whatsappNumber && u.whatsappOptInAt),
});

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json(view(user));
}

/** Turns WhatsApp reminders on (with a number and consent) or off. */
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (body.on === false) {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { whatsappOptInAt: null } });
    return NextResponse.json(view(updated));
  }
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED("WhatsApp reminders"), { status: 402 });
  if (!whatsappConfigured()) return NextResponse.json({ error: "WhatsApp reminders aren't available yet." }, { status: 503 });
  const number = typeof body.number === "string" ? normalizePhone(body.number) : null;
  if (!number) return NextResponse.json({ error: "Enter a WhatsApp number, like 98765 43210 or +91 98765 43210", field: "number" }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: "Tick the box to agree to reminder messages", field: "consent" }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { whatsappNumber: number, whatsappOptInAt: new Date() } });
  return NextResponse.json(view(updated));
}
