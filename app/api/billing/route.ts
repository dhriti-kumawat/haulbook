import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseBilling, pickBilling } from "@/lib/billing";
import { NextRequest, NextResponse } from "next/server";

/** The creator's invoice details. */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json(pickBilling(user));
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const parsed = parseBilling((await req.json().catch(() => ({}))) ?? {});
  if (parsed.errors) return NextResponse.json({ error: "Check the highlighted fields", fields: parsed.errors }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: parsed.data! });
  return NextResponse.json(pickBilling(updated));
}
