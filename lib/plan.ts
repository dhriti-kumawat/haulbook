/**
 * Free and Pro plans.
 *
 * Until payments exist, Haulbook is in early access: PLAN_LIMITS is off, so every account gets Pro
 * features and no limits apply. Set PLAN_LIMITS=on (in Vercel) to start enforcing the Free limits;
 * accounts with plan = "pro" keep everything.
 */
export const FREE_ACTIVE_LIMIT = 25;

export type ProFeature = "calendar" | "reports" | "export" | "push" | "whatsapp" | "income" | "invoices";

export const PRO_FEATURES: { key: ProFeature | "unlimited"; label: string }[] = [
  { key: "unlimited", label: "Unlimited products (Free: up to 25 active)" },
  { key: "push", label: "Phone notifications" },
  { key: "whatsapp", label: "WhatsApp reminders" },
  { key: "calendar", label: "Calendar view" },
  { key: "reports", label: "Brand reports" },
  { key: "export", label: "CSV export" },
  { key: "income", label: "Income dashboard: fees, refunds and per-brand totals by financial year" },
  { key: "invoices", label: "Invoices and payment follow-ups for paid collabs" },
];

/** Whether the Free limits are switched on (server side). */
export const limitsEnforced = () => process.env.PLAN_LIMITS === "on";

/** Whether a user gets Pro features right now. */
export function hasPro(user: { plan: string }, enforced = limitsEnforced()) {
  return !enforced || user.plan === "pro";
}

/** What the app needs to know about the user's plan. */
export function planInfo(user: { plan: string }, activeCount: number) {
  const enforced = limitsEnforced();
  const pro = hasPro(user, enforced);
  return {
    plan: user.plan === "pro" ? "pro" : "free",
    pro,
    earlyAccess: !enforced,
    activeCount,
    activeLimit: pro ? null : FREE_ACTIVE_LIMIT,
  } as const;
}
export type PlanInfo = ReturnType<typeof planInfo>;

export const PRO_REQUIRED = (what: string) => ({ error: `${what} is part of Haulbook Pro.`, upgrade: true });
