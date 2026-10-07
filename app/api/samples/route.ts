import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { sampleProducts } from "@/lib/samples";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

/** Adds example products, once. */
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  const existing = await prisma.product.count({ where: { userId: user.id, isSample: true } });
  if (existing === 0) {
    await prisma.product.createMany({ data: sampleProducts().map((p) => ({ ...p, userId: user.id, isSample: true })) });
  }
  const products = await prisma.product.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(products.map((p) => productView(p)));
}

/** Removes the example products. The user's own products are untouched. */
export async function DELETE() {
  const { user, error } = await requireUser();
  if (error) return error;
  const { count } = await prisma.product.deleteMany({ where: { userId: user.id, isSample: true } });
  return NextResponse.json({ removed: count });
}
