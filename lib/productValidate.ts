/**
 * Field-by-field checks for the product edit form, in plain words, so problems show next to
 * the field instead of as one server error. Mirrors the rules in productInput.ts.
 */
export interface ProductFormValues {
  title: string;
  type: "bought" | "pr" | "collab";
  shop: string;
  price: string;
  fee: string;
  deliverables: string;
  returnWindowDays: string;
  postBy: string;
  url: string;
  postUrl: string;
  notes: string;
}

export type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

export const LIMITS = { title: 120, shop: 40, deliverables: 120, notes: 2000 } as const;
const MAX_AMOUNT = 10_000_000;

function badLink(v: string) {
  try {
    const u = new URL(v.trim());
    return !(u.protocol === "https:" || u.protocol === "http:") || !u.hostname.includes(".");
  } catch {
    return true;
  }
}

function badAmount(v: string, label: string): string | undefined {
  if (!v.trim()) return;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (n < 0) return `${label} can't be negative`;
  if (n > MAX_AMOUNT) return `${label} looks too high`;
  if (!/^\d+(\.\d{1,2})?$/.test(v.trim())) return `${label} can have at most 2 decimals`;
}

export function validateProduct(f: ProductFormValues): FieldErrors {
  const e: FieldErrors = {};
  const title = f.title.trim();
  if (!title) e.title = "Add a name for this product";
  else if (title.length > LIMITS.title) e.title = `Keep the name under ${LIMITS.title} characters`;

  if (f.shop.trim().length > LIMITS.shop) e.shop = `Keep this under ${LIMITS.shop} characters`;

  if (f.type === "collab") {
    const m = badAmount(f.fee, "Fee");
    if (m) e.fee = m;
  } else {
    const m = badAmount(f.price, f.type === "bought" ? "Price" : "Value");
    if (m) e.price = m;
  }

  if (f.type === "bought" && f.returnWindowDays.trim()) {
    const n = Number(f.returnWindowDays);
    if (!Number.isInteger(n)) e.returnWindowDays = "Use whole days, like 7 or 10";
    else if (n < 0 || n > 365) e.returnWindowDays = "Use a number from 0 to 365";
  }

  if (f.type !== "bought") {
    if (f.postBy && isNaN(new Date(f.postBy).getTime())) e.postBy = "Pick a valid date";
    if (f.deliverables.trim().length > LIMITS.deliverables) e.deliverables = `Keep this under ${LIMITS.deliverables} characters`;
  }

  if (f.url.trim() && badLink(f.url)) e.url = "Paste the full link, starting with https://";
  if (f.postUrl.trim() && badLink(f.postUrl)) e.postUrl = "Paste the full link, starting with https://";
  if (f.notes.length > LIMITS.notes) e.notes = `Notes can be up to ${LIMITS.notes} characters`;
  return e;
}
