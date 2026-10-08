"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { useProducts } from "./ProductsProvider";

/** True while the user can use Pro features (always true during early access). */
export function useHasPro() {
  const { settings } = useProducts();
  return settings?.planInfo?.pro ?? true;
}

/** Small "Pro" chip next to Pro features. */
export function ProChip() {
  return <span className="pro-chip">Pro</span>;
}

/** Shows children for Pro users; otherwise a short card explaining the feature and linking to plans. */
export function ProGate({ feature, children }: { feature: string; children: ReactNode }) {
  const pro = useHasPro();
  if (pro) return <>{children}</>;
  return (
    <section className="pro-locked">
      <span className="pro-locked-icon"><Icon name="sparkle" size={20} /></span>
      <h2>{feature} is part of Haulbook Pro</h2>
      <p className="muted">Pro adds unlimited products, phone and WhatsApp reminders, the calendar, brand reports, earnings and invoices.</p>
      <Link href="/pro" className="btn btn-primary">See Pro</Link>
    </section>
  );
}
