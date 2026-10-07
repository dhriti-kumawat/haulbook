const DAY = 86_400_000;
const ago = (n: number) => new Date(Date.now() - n * DAY);
const ahead = (n: number) => new Date(Date.now() + n * DAY);

/** Example products for new creators to explore the app with. Marked isSample so one tap removes them. */
export function sampleProducts() {
  return [
    { title: "Sample · Wireless earbuds", type: "bought", shop: "Amazon", price: 2499, returnWindowDays: 10,
      orderedAt: ago(10), deliveredAt: ago(8), filmedAt: ago(5) },
    { title: "Sample · Sunscreen SPF 50", type: "collab", shop: "A skincare brand", fee: 8000, deliverables: "1 Reel",
      orderedAt: ago(5), deliveredAt: ago(3), postBy: ahead(6) },
    { title: "Sample · Running shoes", type: "bought", shop: "Myntra", price: 6999, returnWindowDays: 14,
      orderedAt: ago(26), deliveredAt: ago(24), filmedAt: ago(20), postedAt: ago(18), returnedAt: ago(12) },
    { title: "Sample · Phone PR kit", type: "pr", shop: "A phone brand", deliverables: "1 Reel + 2 stories",
      orderedAt: ago(4), deliveredAt: ago(2), postBy: ahead(3) },
    { title: "Sample · Desk lamp", type: "bought", shop: "Flipkart", price: 1899, returnWindowDays: 7,
      orderedAt: ago(1) },
  ];
}
