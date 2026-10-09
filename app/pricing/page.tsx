import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark, Icon } from "@/components/Icon";
import { PlanCompare } from "@/components/PlanCompare";
import { FAQ_GROUPS } from "@/lib/faq";
import { FREE_ACTIVE_LIMIT, PRO_EARLY_PRICE, PRO_PRICE } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Pricing · Haulbook",
  description: "Haulbook is free to start. Pro adds unlimited products, phone and WhatsApp reminders, earnings and invoices, and costs ₹99 a month during early access (usually ₹199).",
};

const FREE = [`Up to ${FREE_ACTIVE_LIMIT} products in progress`, "Add by link or by voice", "Return, posting and payment countdowns", "Email reminders", "List and board views"];
const PRO = ["Unlimited products", "Phone and WhatsApp reminders", "Calendar view", "Earnings by financial year", "Invoices and payment reminders", "Brand reports and CSV export"];
const PLAN_FAQ = FAQ_GROUPS.find((g) => g.title === "Plans")?.items ?? [];

/** Public pricing page: plans, full comparison and billing questions. */
export default function PricingPage() {
  return (
    <div className="landing pricing">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
        <nav className="l-nav" aria-label="Account">
          <Link href="/auth/signin" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">Get started</Link>
        </nav>
      </header>

      <main>
        <div className="l-head pricing-head">
          <span className="l-pill"><i />Pricing</span>
          <h1 className="l-h2">Start free. <span className="l-soft">Grow into Pro.</span></h1>
          <p>Free forever for getting started. Pro is ₹{PRO_EARLY_PRICE} a month during early access, usually ₹{PRO_PRICE}.</p>
        </div>

        <div className="price-cards">
          <section className="price-card">
            <h2>Free</h2>
            <p className="price-sub">For getting every review on track.</p>
            <div className="price-amount"><b>₹0</b><span>forever</span></div>
            <Link href="/auth/signup" className="btn btn-secondary btn-block">Create your haulbook</Link>
            <ul>{FREE.map((t) => <li key={t}><Icon name="check" size={15} />{t}</li>)}</ul>
          </section>

          <section className="price-card is-pro grad">
            <span className="l-sticker price-sticker"><span className="l-sticker-icon"><Icon name="check" size={13} /></span>Early access price</span>
            <h2>Pro</h2>
            <p className="price-sub">For creators running paid collabs.</p>
            <div className="price-amount"><s>₹{PRO_PRICE}</s><b>₹{PRO_EARLY_PRICE}</b><span>/ month</span></div>
            <Link href="/auth/signup" className="btn btn-primary btn-block">Get Pro for ₹{PRO_EARLY_PRICE}</Link>
            <ul>
              <li className="price-everything"><Icon name="check" size={15} />Everything in Free, plus:</li>
              {PRO.map((t) => <li key={t}><Icon name="check" size={15} />{t}</li>)}
            </ul>
            <p className="price-note">Payments open soon. Join now and every Pro feature is unlocked until then, and you keep the ₹{PRO_EARLY_PRICE} early-access price. You can always stay on Free.</p>
          </section>
        </div>

        <section className="pricing-section">
          <h2 className="pricing-h">Compare plans</h2>
          <PlanCompare />
        </section>

        <section className="pricing-section">
          <h2 className="pricing-h">Plan questions</h2>
          <div className="faq pricing-faq">
            {PLAN_FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}<Icon name="plus" size={16} /></summary>
                <p>{f.a}</p>
              </details>
            ))}
            <details className="faq-item">
              <summary>Do I need a card to start?<Icon name="plus" size={16} /></summary>
              <p>No. Sign up with Google or your email and start on Free; nothing to pay.</p>
            </details>
          </div>
          <p className="help-more muted">More questions? <Link href="/help">See Help</Link></p>
        </section>
      </main>
    </div>
  );
}
