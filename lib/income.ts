import type { ProductView } from "./products";

/** Indian financial year that a date falls in: FY 2026-27 runs 1 Apr 2026 to 31 Mar 2027. Returns its start year. */
export function fyOf(d: Date | string) {
  const x = new Date(d);
  return x.getMonth() >= 3 ? x.getFullYear() : x.getFullYear() - 1;
}
export const fyLabel = (start: number) => `FY ${start}-${String(start + 1).slice(-2)}`;
const inFy = (iso: string | null, start: number) => Boolean(iso) && fyOf(iso!) === start;

export interface BrandIncome {
  brand: string;
  products: number;
  feesEarned: number;
  feesDue: number;
  refundsRecovered: number;
  refundsPending: number;
  prValue: number;
  spent: number;
}

export interface IncomeSummary {
  fy: number;
  feesEarned: number;
  feesDue: number;
  refundsRecovered: number;
  refundsPending: number;
  spent: number;
  keptValue: number;
  prValue: number;
  /** Fees earned per month, April first. */
  months: number[];
  brands: BrandIncome[];
  /** Line items behind the totals, for the CSV. */
  items: { date: string; kind: string; product: string; brand: string; amount: number }[];
}

/**
 * Money for one financial year. Earned and recovered amounts count in the year they arrived;
 * "due" and "pending" are what's still outstanding today, whatever year it started.
 */
export function incomeFor(products: ProductView[], fy: number): IncomeSummary {
  const s: IncomeSummary = { fy, feesEarned: 0, feesDue: 0, refundsRecovered: 0, refundsPending: 0, spent: 0, keptValue: 0, prValue: 0, months: Array(12).fill(0), brands: [], items: [] };
  const brands = new Map<string, BrandIncome>();
  const brandOf = (p: ProductView) => {
    const name = p.shop?.trim() || "No brand";
    const key = name.toLowerCase();
    let b = brands.get(key);
    if (!b) brands.set(key, (b = { brand: name, products: 0, feesEarned: 0, feesDue: 0, refundsRecovered: 0, refundsPending: 0, prValue: 0, spent: 0 }));
    return b;
  };

  for (const p of products) {
    if (p.isSample) continue;
    const b = brandOf(p);
    let touched = false;
    const add = (date: string, kind: string, amount: number) => s.items.push({ date: date.slice(0, 10), kind, product: p.title, brand: b.brand, amount });

    if (p.type === "collab" && p.fee) {
      if (p.paidAt && inFy(p.paidAt, fy)) {
        s.feesEarned += p.fee; b.feesEarned += p.fee; touched = true;
        s.months[(new Date(p.paidAt).getMonth() + 9) % 12] += p.fee;
        add(p.paidAt, "Collab fee received", p.fee);
      } else if (p.postedAt && !p.paidAt) {
        s.feesDue += p.fee; b.feesDue += p.fee; touched = true;
      }
    }
    if (p.type === "bought" && p.price) {
      if (inFy(p.orderedAt, fy)) {
        s.spent += p.price; b.spent += p.price; touched = true;
        add(p.orderedAt, "Bought", -p.price);
      }
      if (p.refundedAt && inFy(p.refundedAt, fy)) {
        s.refundsRecovered += p.price; b.refundsRecovered += p.price; touched = true;
        add(p.refundedAt, "Refund received", p.price);
      } else if (p.returnedAt && !p.refundedAt) {
        s.refundsPending += p.price; b.refundsPending += p.price; touched = true;
      }
      if (p.keptAt && inFy(p.keptAt, fy)) s.keptValue += p.price;
    }
    if (p.type === "pr" && p.price && p.deliveredAt && inFy(p.deliveredAt, fy)) {
      s.prValue += p.price; b.prValue += p.price; touched = true;
      add(p.deliveredAt, "PR product received (value)", p.price);
    }
    if (touched) b.products += 1;
  }
  s.brands = [...brands.values()].filter((b) => b.products).sort((a, b) => b.feesEarned + b.feesDue - (a.feesEarned + a.feesDue) || b.refundsRecovered - a.refundsRecovered);
  s.items.sort((a, b) => a.date.localeCompare(b.date));
  return s;
}

/** Financial years that have any activity, newest first, always including the current one. */
export function activeYears(products: ProductView[]) {
  const years = new Set<number>([fyOf(new Date())]);
  for (const p of products) for (const d of [p.orderedAt, p.paidAt, p.refundedAt, p.deliveredAt]) if (d) years.add(fyOf(d));
  return [...years].sort((a, b) => b - a);
}
