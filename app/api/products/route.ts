import { prisma } from "@/lib/prisma";
import { productView } from "@/lib/products";
import { ensureDelivered, parseProductInput } from "@/lib/productInput";
import { requireUser } from "@/lib/session";
import { FREE_ACTIVE_LIMIT, hasPro } from "@/lib/plan";
import { activeProductCount } from "@/lib/planServer";
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
  if (!hasPro(user) && (await activeProductCount(user.id)) >= FREE_ACTIVE_LIMIT) {
    return NextResponse.json(
      { error: `Free accounts can track ${FREE_ACTIVE_LIMIT} products in progress. Finish or delete one, or upgrade to Pro for unlimited.`, upgrade: true },
      { status: 402 }
    );
  }
  const parsed = parseProductInput(await req.json().catch(() => null), false);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const product = await prisma.product.create({
    data: { ...(ensureDelivered(parsed.data!) as { title: string }), userId: user.id },
  });
  return NextResponse.json(productView(product), { status: 201 });
}
