import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { pickBilling } from "@/lib/billing";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * Invoice for a paid collab. The first request gives it the next invoice number for this creator,
 * so numbers never repeat; later requests show the same number.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED("Invoices"), { status: 402 });
  const { id } = await params;
  let product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.userId !== user.id) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.type !== "collab") return NextResponse.json({ error: "Invoices are for paid collabs." }, { status: 400 });

  if (!product.invoiceNumber) {
    product = await prisma.$transaction(async (tx) => {
      const last = await tx.product.aggregate({ where: { userId: user.id }, _max: { invoiceNumber: true } });
      return tx.product.update({ where: { id: product!.id }, data: { invoiceNumber: (last._max.invoiceNumber ?? 0) + 1, invoicedAt: new Date() } });
    });
  }
  return NextResponse.json({ product: productView(product), billing: pickBilling(user), invoiceNumber: product.invoiceNumber, invoicedAt: product.invoicedAt });
}
