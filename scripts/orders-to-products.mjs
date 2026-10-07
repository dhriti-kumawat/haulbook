// One-time conversion: every item of every old order becomes a "bought" Product.
// Safe to re-run: items already converted (same user, title and order date) are skipped.
// The old Order and SubProduct tables are left untouched.
// Usage: node scripts/orders-to-products.mjs        (reads DATABASE_URL from the environment)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const orders = await prisma.order.findMany({ include: { subProducts: true } });
let created = 0;
let skipped = 0;

for (const order of orders) {
  for (const item of order.subProducts) {
    const exists = await prisma.product.findFirst({
      where: { userId: order.userId, title: item.productName, orderedAt: order.orderedDate },
    });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        userId: order.userId,
        title: item.productName,
        type: "bought",
        shop: order.platform || null,
        price: item.price ?? (order.subProducts.length === 1 ? order.amount : null),
        orderedAt: order.orderedDate,
        deliveredAt: item.delivery ?? order.deliveryDate,
        returnedAt: item.returnedDate ?? (item.returned ? item.updatedAt : null),
        keptAt: item.keptDate ?? (item.kept ? item.updatedAt : null),
        returnWindowDays: item.policyDays,
        returnBy: item.returnDeadline,
        notes: order.orderID ? `Order ID: ${order.orderID}` : null,
      },
    });
    created++;
  }
}
console.log(`Converted ${created} items into products (${skipped} already converted).`);
await prisma.$disconnect();
