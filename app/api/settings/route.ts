import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { planFor } from "@/lib/planServer";

const pick = (u: { remindersEnabled: boolean; reminderDaysBefore: number; onboardedAt: Date | null; email: string | null; phone?: string | null }) => ({
  remindersEnabled: u.remindersEnabled,
  reminderDaysBefore: u.reminderDaysBefore,
  onboarded: Boolean(u.onboardedAt),
  email: u.email,
  phone: u.phone ?? null,
});

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ ...pick(user), planInfo: await planFor(user) });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const data: { remindersEnabled?: boolean; reminderDaysBefore?: number; onboardedAt?: Date } = {};
  if (body.remindersEnabled !== undefined) {
    if (typeof body.remindersEnabled !== "boolean") return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    data.remindersEnabled = body.remindersEnabled;
  }
  if (body.reminderDaysBefore !== undefined) {
    const n = Number(body.reminderDaysBefore);
    if (![1, 2, 3, 5, 7].includes(n)) return NextResponse.json({ error: "Pick 1, 2, 3, 5 or 7 days" }, { status: 400 });
    data.reminderDaysBefore = n;
  }
  if (body.onboarded === true) data.onboardedAt = new Date();
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ...pick(updated), planInfo: await planFor(updated) });
}
