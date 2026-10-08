"use client";

import { Icon } from "@/components/Icon";
import { useProducts } from "@/components/ProductsProvider";
import { FREE_ACTIVE_LIMIT } from "@/lib/plan";

const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Products in progress", free: `Up to ${FREE_ACTIVE_LIMIT}`, pro: "Unlimited" },
  { label: "Email reminders", free: true, pro: true },
  { label: "List and board views", free: true, pro: true },
  { label: "Add by link and by voice", free: true, pro: true },
  { label: "Phone notifications", free: false, pro: true },
  { label: "WhatsApp reminders", free: false, pro: true },
  { label: "Calendar view", free: false, pro: true },
  { label: "Brand reports", free: false, pro: true },
  { label: "CSV export", free: false, pro: true },
  { label: "Income dashboard by financial year", free: false, pro: true },
  { label: "Invoices and payment follow-ups", free: false, pro: true },
];

function Mark({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <span>{v}</span>;
  return v ? <Icon name="check" size={16} /> : <span className="muted" aria-label="Not included">–</span>;
}

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

      <table className="report-table plan-table">
        <thead><tr><th>Feature</th><th>Free</th><th>Pro</th></tr></thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label}><td>{r.label}</td><td><Mark v={r.free} /></td><td><Mark v={r.pro} /></td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
