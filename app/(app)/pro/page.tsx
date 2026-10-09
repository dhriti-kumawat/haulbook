"use client";

import { Icon } from "@/components/Icon";
import { useProducts } from "@/components/ProductsProvider";
import { PlanCompare } from "@/components/PlanCompare";

export default function ProPage() {
  const { settings } = useProducts();
  const info = settings?.planInfo;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Free and Pro</h1>
          <p className="page-sub">Start free. Pro is for creators reviewing a lot of products and running paid collabs.</p>
        </div>
      </div>

      {info?.earlyAccess && (
        <p className="pro-banner"><Icon name="sparkle" size={16} /> Everyone gets Pro free during early access. Nothing to do.</p>
      )}

      <div className="plan-grid">
        <section className="plan-col">
          <h2>Free</h2>
          <p className="muted">Track your reviews and never miss a return window.</p>
        </section>
        <section className="plan-col is-pro">
          <h2>Pro</h2>
          <p className="muted">Unlimited products, every reminder, income and invoices.</p>
          <button type="button" className="btn btn-primary" disabled>
            {info?.plan === "pro" || info?.earlyAccess ? "You have Pro" : "Upgrade: coming soon"}
          </button>
        </section>
      </div>

      <PlanCompare />
    </>
  );
}
