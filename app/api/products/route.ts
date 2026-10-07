import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { ensureDelivered, parseProductInput } from "@/lib/productInput";
import { requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const products = await prisma.product.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(products.map((p) => productView(p)));
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const parsed = parseProductInput(await req.json().catch(() => null), false);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const product = await prisma.product.create({
    data: { ...(ensureDelivered(parsed.data!) as { title: string }), userId: user.id },
  });
  return NextResponse.json(productView(product), { status: 201 });
}
