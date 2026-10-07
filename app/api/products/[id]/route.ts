import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { ensureDelivered, parseProductInput } from "@/lib/productInput";
import { requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// Next 15: route params arrive as a promise.
type Params = { params: Promise<{ id: string }> };

async function findOwned(id: string, userId: string) {
  const p = await prisma.product.findUnique({ where: { id } });
  return p && p.userId === userId ? p : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  const product = await findOwned(id, user.id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const parsed = parseProductInput(await req.json().catch(() => null), true);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.product.update({ where: { id: product.id }, data: ensureDelivered(parsed.data!, product) });
  return NextResponse.json(productView(updated));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  const product = await findOwned(id, user.id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  await prisma.product.delete({ where: { id: product.id } });
  return NextResponse.json({ success: true });
}
