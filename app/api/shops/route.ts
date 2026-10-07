import { prisma } from "@/lib/prisma";
import { parseShopFields, requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const shops = await prisma.shop.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });
  return NextResponse.json(shops);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const parsed = parseShopFields(await req.json().catch(() => ({})), false);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await prisma.shop.findFirst({
    where: { userId: user.id, name: { equals: parsed.data!.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: `${existing.name} is already in your shops` }, { status: 409 });
  }

  const shop = await prisma.shop.create({
    data: { userId: user.id, name: parsed.data!.name!, policyDays: parsed.data!.policyDays! },
  });
  return NextResponse.json(shop, { status: 201 });
}
