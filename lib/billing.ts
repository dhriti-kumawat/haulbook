/** The creator's details printed on invoices. All optional; the invoice shows what's filled. */
export const BILLING_FIELDS = [
  { key: "billingName", label: "Name on invoices", max: 100, placeholder: "Your name or business name" },
  { key: "billingAddress", label: "Address", max: 300, placeholder: "City, state, PIN", multiline: true },
  { key: "billingEmail", label: "Email", max: 254, placeholder: "you@example.com" },
  { key: "billingPhone", label: "Phone", max: 20, placeholder: "+91 98765 43210" },
  { key: "billingUpi", label: "UPI ID", max: 60, placeholder: "name@bank" },
  { key: "billingBank", label: "Bank details", max: 300, placeholder: "Account name, number, IFSC", multiline: true },
  { key: "billingGstin", label: "GSTIN (if registered)", max: 15, placeholder: "22AAAAA0000A1Z5" },
  { key: "billingPan", label: "PAN", max: 10, placeholder: "AAAAA0000A" },
] as const;
export type BillingKey = (typeof BILLING_FIELDS)[number]["key"];
export type Billing = Record<BillingKey, string | null>;

const CHECKS: Partial<Record<BillingKey, [RegExp, string]>> = {
  billingEmail: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
  billingPhone: [/^\+?[\d\s-]{8,20}$/, "Enter a valid phone number"],
  billingUpi: [/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "UPI IDs look like name@bank"],
  billingGstin: [/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, "A GSTIN is 15 characters, like 22AAAAA0000A1Z5"],
  billingPan: [/^[A-Z]{5}\d{4}[A-Z]$/, "A PAN is 10 characters, like AAAAA0000A"],
};

/** Cleans and checks billing details; returns the values to save or field errors. */
export function parseBilling(body: Record<string, unknown>): { data?: Partial<Billing>; errors?: Partial<Record<BillingKey, string>> } {
  const data: Partial<Billing> = {};
  const errors: Partial<Record<BillingKey, string>> = {};
  for (const f of BILLING_FIELDS) {
    if (body[f.key] === undefined) continue;
    let v = typeof body[f.key] === "string" ? (body[f.key] as string).trim() : "";
    if (f.key === "billingGstin" || f.key === "billingPan") v = v.toUpperCase().replace(/\s/g, "");
    if (!v) {
      data[f.key] = null;
      continue;
    }
    if (v.length > f.max) errors[f.key] = `Keep this under ${f.max} characters`;
    else if (CHECKS[f.key] && !CHECKS[f.key]![0].test(v)) errors[f.key] = CHECKS[f.key]![1];
    else data[f.key] = v;
  }
  return Object.keys(errors).length ? { errors } : { data };
}

export const pickBilling = (u: Record<string, unknown>): Billing =>
  Object.fromEntries(BILLING_FIELDS.map((f) => [f.key, (u[f.key] as string | null) ?? null])) as Billing;

/** A polite payment reminder the creator can send the brand. */
export function followUpMessage(p: { title: string; shop: string | null; fee: number | null; postedAt: string | null; postUrl: string | null; invoiceNumber?: number | null }, from: string | null) {
  const amount = p.fee ? `₹${p.fee.toLocaleString("en-IN")}` : "the agreed fee";
  const posted = p.postedAt ? new Date(p.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : null;
  const days = p.postedAt ? Math.floor((Date.now() - new Date(p.postedAt).getTime()) / 86_400_000) : null;
  return [
    `Hi${p.shop ? ` ${p.shop} team` : ""},`,
    "",
    `Hope you're well. A quick reminder about the payment of ${amount} for the ${p.title} collaboration${p.invoiceNumber ? ` (invoice #${p.invoiceNumber})` : ""}.`,
    posted ? `The content went live on ${posted}${days && days > 0 ? `, ${days} day${days === 1 ? "" : "s"} ago` : ""}${p.postUrl ? `: ${p.postUrl}` : "."}` : "",
    "",
    "Could you let me know when it will be processed? Thank you!",
    from ? `\n${from}` : "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim();
}
