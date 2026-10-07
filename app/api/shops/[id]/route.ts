import { prisma } from "@/lib/prisma";
import { parseShopFields, requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: { id: string } };

async function findOwned(id: string, userId: string) {
  const shop = await prisma.shop.findUnique({ where: { id } });
  return shop && shop.userId === userId ? shop : null;
}

/** Edits a shop. Renaming also renames the shop on the user's existing orders. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  const shop = await findOwned(params.id, user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const parsed = parseShopFields(await req.json().catch(() => ({})), true);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.shop.update({ where: { id: shop.id }, data: parsed.data! });
  if (parsed.data!.name && parsed.data!.name !== shop.name) {
    await prisma.order.updateMany({
      where: { userId: user.id, platform: shop.name },
      data: { platform: parsed.data!.name },
    });
  }
  return NextResponse.json(updated);
}

/** Removes a shop from the list. Orders from it are kept. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  const shop = await findOwned(params.id, user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  await prisma.shop.delete({ where: { id: shop.id } });
  return NextResponse.json({ success: true });
}
