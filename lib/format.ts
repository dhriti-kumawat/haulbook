const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

export const formatMoney = (n: number) => money.format(n);
export const formatDate = (iso: string) => shortDate.format(new Date(iso));

/**
 * YYYY-MM-DD for a date input, in the device's time zone. (toISOString() is UTC, which in India is
 * still "yesterday" until 5:30 in the morning.)
 */
export function localDay(d: Date | string = new Date()) {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function initials(name?: string | null, email?: string | null) {
  // Phone and Instagram accounts can have neither; "?" looked like a help button.
  const source = (name || email || "").trim();
  if (!source) return "Me";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export const PLATFORMS: { name: string; policyDays: number; color: string }[] = [
  { name: "Amazon", policyDays: 10, color: "#232F3E" },
  { name: "Flipkart", policyDays: 7, color: "#2874F0" },
  { name: "Myntra", policyDays: 14, color: "#E8336D" },
  { name: "Meesho", policyDays: 7, color: "#9F2089" },
  { name: "Ajio", policyDays: 15, color: "#2C4152" },
  { name: "Nykaa", policyDays: 15, color: "#E80071" },
  { name: "Decathlon", policyDays: 15, color: "#0082C3" },
];

export function platformColor(name: string) {
  const known = PLATFORMS.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (known) return known.color;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 45% 40%)`;
}
