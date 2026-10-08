import { prisma } from "./prisma";
import { productView } from "./products";
import { planInfo } from "./plan";

/** Products still in progress (not done, not samples): what the Free limit counts. */
export async function activeProductCount(userId: string) {
  const products = await prisma.product.findMany({ where: { userId, isSample: false } });
  return products.map((p) => productView(p)).filter((p) => p.stage !== "done").length;
}

export async function planFor(user: { id: string; plan: string }) {
  return planInfo(user, await activeProductCount(user.id));
}
