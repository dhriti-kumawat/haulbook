import Link from "next/link";
import type { PlanInfo } from "@/lib/plan";

/** Settings card: which plan you're on, and how close Free is to its product limit. */
export function PlanCard({ info }: { info: PlanInfo }) {
  return (
    <section className="panel-card plan-card">
      <div className="panel-card-head">
        <div>
          <h2>
            {info.plan === "pro" ? "Haulbook Pro" : info.earlyAccess ? "Pro unlocked while payments open" : "Free plan"}
          </h2>
          <p className="muted">
            {info.plan === "pro"
              ? "Everything is unlocked."
              : info.earlyAccess
                ? "Pro is ₹99 a month during early access (usually ₹199). Until payments open, every Pro feature is on for you, and you keep the early price."
                : `${info.activeCount} of ${info.activeLimit} products in progress. Pro adds unlimited products and more.`}
          </p>
        </div>
        <span className={`plan-badge ${info.pro ? "is-pro" : ""}`}>{info.pro ? "Pro" : "Free"}</span>
      </div>
      {info.activeLimit != null && (
        <div className="plan-meter" role="meter" aria-valuemin={0} aria-valuemax={info.activeLimit} aria-valuenow={info.activeCount} aria-label="Products in progress">
          <i style={{ width: `${Math.min(100, (info.activeCount / info.activeLimit) * 100)}%` }} />
        </div>
      )}
      <div><Link href="/pro" className="btn btn-secondary btn-sm">Compare Free and Pro</Link></div>
    </section>
  );
}
