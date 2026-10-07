// Seeds a demo account with realistic orders for local UI work.
// Usage: DATABASE_URL=postgresql://localhost/tracker_ui_demo node scripts/seed-demo.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEMO_EMAIL = "demo@example.test";
const DEMO_PASSWORD = "a52a1b61224566e8";

// Local demo data only: refuse to touch anything that isn't a local database.
const dbUrl = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || !/@?(localhost|127\.0\.0\.1)[:/]/.test(dbUrl)) {
  console.error("seed-demo only runs against a local database (DATABASE_URL on localhost).");
  process.exit(1);
}

const prisma = new PrismaClient();
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });
const user = await prisma.user.create({
  data: { name: "Demo User", email: DEMO_EMAIL, password: await bcrypt.hash(DEMO_PASSWORD, 10) },
});

const orders = [
  { orderID: "403-8812734", platform: "Amazon", status: "Delivered", amount: 2499, orderedDate: daysAgo(12), deliveryDate: daysAgo(8),
    items: [{ productName: "Wireless earbuds", policyDays: 10 }, { productName: "USB-C charging cable", policyDays: 10, returned: true }] },
  { orderID: "MYN-55120", platform: "Myntra", status: "Delivered", amount: 1799, orderedDate: daysAgo(16), deliveryDate: daysAgo(12),
    items: [{ productName: "Linen shirt, size M", policyDays: 14 }, { productName: "Cotton chinos", policyDays: 14 }] },
  { orderID: "OD4410293", platform: "Flipkart", status: "Delivered", amount: 3299, orderedDate: daysAgo(5), deliveryDate: daysAgo(2),
    items: [{ productName: "Running shoes", policyDays: 7 }] },
  { orderID: "MS-998812", platform: "Meesho", status: "Shipped", amount: 449, orderedDate: daysAgo(3), deliveryDate: null,
    items: [{ productName: "Phone case", policyDays: 7 }] },
  { orderID: "AJ-202611", platform: "Ajio", status: "Delivered", amount: 1299, orderedDate: daysAgo(30), deliveryDate: daysAgo(25),
    items: [{ productName: "Denim jacket", policyDays: 15 }] },
  { orderID: "MYN-61877", platform: "Myntra", status: "Delivered", amount: 6840, orderedDate: daysAgo(6), deliveryDate: daysAgo(3),
    items: ["Kurta set", "Palazzo pants", "Dupatta", "Sneakers", "Tote bag", "Sunglasses"].map((productName) => ({ productName, policyDays: 14 })) },
  { orderID: "MYN-60012", platform: "Myntra", status: "Delivered", amount: 899, orderedDate: daysAgo(40), deliveryDate: daysAgo(36),
    items: [{ productName: "Socks, pack of 3", policyDays: 14, returned: true }] },
  { orderID: "MYN-59871", platform: "Myntra", status: "Delivered", amount: 2199, orderedDate: daysAgo(50), deliveryDate: daysAgo(45),
    items: [{ productName: "Hoodie", policyDays: 14 }] },
  { orderID: "403-9917201", platform: "Amazon", status: "Delivered", amount: 549, orderedDate: daysAgo(9), deliveryDate: daysAgo(7),
    items: [{ productName: "Desk lamp bulb", policyDays: 10 }] },
  { orderID: "403-7712009", platform: "Amazon", status: "Delivered", amount: 12999, orderedDate: daysAgo(4), deliveryDate: daysAgo(1),
    items: [{ productName: "Mechanical keyboard", policyDays: 10 }, { productName: "Mouse pad XL", policyDays: 10 }] },
  { orderID: "403-5521780", platform: "Amazon", status: "Delivered", amount: 1499, orderedDate: daysAgo(35), deliveryDate: daysAgo(30),
    items: [{ productName: "Water bottle", policyDays: 10 }] },
  { orderID: "403-4410091", platform: "Amazon", status: "Shipped", amount: 799, orderedDate: daysAgo(2), deliveryDate: null,
    items: [{ productName: "Notebook set", policyDays: 10 }] },
];

for (const o of orders) {
  await prisma.order.create({
    data: {
      userId: user.id, orderID: o.orderID, platform: o.platform, status: o.status, amount: o.amount,
      orderedDate: o.orderedDate, deliveryDate: o.deliveryDate,
      subProducts: {
        create: o.items.map((i) => ({
          ...i,
          price: Math.round(o.amount / o.items.length),
          returnedDate: i.returned ? daysAgo(1) : null,
        })),
      },
    },
  });
}
// Creator products: bought, PR and paid collabs at different steps.
const daysFromNow = (n) => new Date(Date.now() + n * 86400000);
const products = [
  { title: "Dyson Airwrap Complete Long", type: "bought", shop: "Amazon", price: 45900, returnWindowDays: 10,
    orderedAt: daysAgo(11), deliveredAt: daysAgo(8), filmedAt: daysAgo(5), postedAt: daysAgo(2) },
  { title: "Nothing Phone (3)", type: "pr", shop: "Nothing India", deliverables: "1 Reel + 2 stories",
    orderedAt: daysAgo(9), deliveredAt: daysAgo(6), filmedAt: daysAgo(2), postBy: daysFromNow(4) },
  { title: "Minimalist SPF 50 Sunscreen", type: "collab", shop: "Minimalist", fee: 12000, deliverables: "2 Reels",
    orderedAt: daysAgo(6), deliveredAt: daysAgo(4), postBy: daysFromNow(8) },
  { title: "Nike Pegasus 41", type: "bought", shop: "Myntra", price: 11895, returnWindowDays: 14,
    orderedAt: daysAgo(30), deliveredAt: daysAgo(27), filmedAt: daysAgo(24), postedAt: daysAgo(21), returnedAt: daysAgo(16) },
  { title: "Muji LED desk lamp", type: "bought", shop: "Amazon", price: 3490, returnWindowDays: 7,
    orderedAt: daysAgo(7), deliveredAt: daysAgo(5) },
  { title: "Sony WH-1000XM6", type: "bought", shop: "Flipkart", price: 32990, returnWindowDays: 7,
    orderedAt: daysAgo(2) },
  { title: "Stanley Quencher 1.18L", type: "bought", shop: "Nykaa", price: 4250, returnWindowDays: 15,
    orderedAt: daysAgo(6), deliveredAt: daysAgo(3), filmedAt: daysAgo(1) },
  { title: "The Ordinary Niacinamide", type: "pr", shop: "Nykaa", deliverables: "1 Reel",
    orderedAt: daysAgo(14), deliveredAt: daysAgo(12), filmedAt: daysAgo(10), postedAt: daysAgo(8),
    postUrl: "https://www.instagram.com/reel/example" },
  { title: "boAt Airdopes 800", type: "collab", shop: "boAt", fee: 18000, deliverables: "1 YouTube Short + 1 Reel",
    orderedAt: daysAgo(50), deliveredAt: daysAgo(47), filmedAt: daysAgo(44), postedAt: daysAgo(40) },
  { title: "Zara linen overshirt", type: "bought", shop: "Zara", price: 3990, returnWindowDays: 30,
    orderedAt: daysAgo(12), deliveredAt: daysAgo(10), filmedAt: daysAgo(9), postedAt: daysAgo(6), keptAt: daysAgo(5) },
  { title: "Philips Air Fryer XL", type: "bought", shop: "Amazon", price: 9999, returnWindowDays: 10,
    orderedAt: daysAgo(40), deliveredAt: daysAgo(37), filmedAt: daysAgo(35), postedAt: daysAgo(33),
    returnedAt: daysAgo(30), refundedAt: daysAgo(25) },
];
await prisma.product.deleteMany({ where: { userId: user.id } });
for (const p of products) await prisma.product.create({ data: { ...p, userId: user.id } });

console.log("Seeded demo account", DEMO_EMAIL);
await prisma.$disconnect();
