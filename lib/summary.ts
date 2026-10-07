import type { ProductView } from "./products";

export type Bucket = "receive" | "film" | "post" | "return" | "money" | "done";

export const BUCKET_LABEL: Record<Bucket, string> = {
  receive: "On the way",
  film: "To film",
  post: "To post",
  return: "To return",
  money: "Waiting for money",
  done: "Done",
};

export function bucketOf(p: ProductView): Bucket {
  switch (p.stage) {
    case "ordered":
      return "receive";
    case "film":
      return "film";
    case "post":
      return "post";
    case "return":
      return "return";
    case "refund":
    case "payment":
      return "money";
    default:
      return "done";
  }
}

/** Lower = more urgent. Products without a deadline sort after those with one. */
export function urgencyScore(p: ProductView) {
  if (p.urgent) return p.urgent.days;
  if (p.stage === "done") return 10_000;
  return 1_000;
}

export function summarize(products: ProductView[]) {
  const sum = (list: ProductView[], pick: (p: ProductView) => number | null) => list.reduce((s, p) => s + (pick(p) ?? 0), 0);
  const refundPending = products.filter((p) => p.stage === "refund");
  const paymentPending = products.filter((p) => p.stage === "payment");
  const returnable = products.filter((p) => p.type === "bought" && p.moneyOut > 0 && p.stage !== "refund");
  return {
    moneyOut: sum(products, (p) => p.moneyOut),
    refundsPending: sum(refundPending, (p) => p.price),
    paymentsDue: sum(paymentPending, (p) => p.fee),
    atStake: sum(returnable, (p) => p.price),
    counts: {
      film: products.filter((p) => bucketOf(p) === "film").length,
      post: products.filter((p) => bucketOf(p) === "post").length,
      returnSoon: products.filter((p) => p.urgent?.kind === "return" && p.urgent.days <= 3).length,
      late: products.filter((p) => p.urgent && p.urgent.days < 0).length,
    },
  };
}
