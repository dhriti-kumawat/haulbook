"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatMoney } from "@/lib/format";
import { bucketOf, summarize, urgencyScore } from "@/lib/summary";
import { Icon, type IconName } from "@/components/Icon";
import { ProductRow } from "@/components/ProductRow";
import { useProducts } from "@/components/ProductsProvider";
import { Onboarding, SampleBanner } from "@/components/Onboarding";

const NEEDS_YOU_LIMIT = 6;

export default function Home() {
  const { products, loading, loadError, reload, openAdd } = useProducts();

  const s = useMemo(() => summarize(products), [products]);

  const needsYou = useMemo(
    () =>
      products
        .filter((p) => p.stage !== "done" && p.stage !== "ordered")
        .sort((a, b) => urgencyScore(a) - urgencyScore(b)),
    [products]
  );
  const onTheWay = products.filter((p) => bucketOf(p) === "receive");
  const thisWeek = needsYou.filter((p) => p.urgent && p.urgent.days <= 7).length;

  const tiles: { key: string; label: string; value: number; href: string; icon: IconName; tone?: string }[] = [
    { key: "film", label: "To film", value: s.counts.film, href: "/products?bucket=film", icon: "video" },
    { key: "post", label: "To post", value: s.counts.post, href: "/products?bucket=post", icon: "send" },
    { key: "return", label: "Return in 3 days", value: s.counts.returnSoon, href: "/products?bucket=return", icon: "return", tone: s.counts.returnSoon ? "is-urgent" : "" },
    { key: "late", label: "Overdue", value: s.counts.late, href: "/products?bucket=money", icon: "alert", tone: s.counts.late ? "is-late" : "" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
          <h1>
            {loading
              ? "Your week"
              : products.length === 0
                ? <>Let&apos;s add your <span className="accent-text">first product</span></>
                : thisWeek
                  ? <><span className="accent-text">{thisWeek} thing{thisWeek === 1 ? "" : "s"}</span> need{thisWeek === 1 ? "s" : ""} you this week</>
                  : <>You&apos;re <span className="accent-text">all caught up</span></>}
          </h1>
          <p className="page-sub">
            {loading
              ? "Loading your products…"
              : products.length === 0
                ? "Paste a product link and its countdown starts."
                : needsYou[0]?.urgent
                  ? <>Next up: <b>{needsYou[0].title}</b>, {needsYou[0].urgent.label.toLowerCase()}</>
                  : "Nothing is due soon. Add a product when the next one arrives."}
          </p>
        </div>
        <button type="button" className="btn btn-primary add-fab" onClick={openAdd}>
          <Icon name="plus" size={16} /> Add product
        </button>
      </div>

      {!loading && !loadError && (
        <>
          <Onboarding />
          <SampleBanner />
        </>
      )}

      {loading ? (
        <div className="home-top" aria-busy="true">
          <div className="skeleton" style={{ height: 196 }} />
          <div className="skeleton" style={{ height: 196 }} />
        </div>
      ) : loadError ? (
        <div className="empty">
          <h3>Could not load your products</h3>
          <p>Check your connection and try again.</p>
          <button type="button" className="btn btn-secondary" onClick={reload}>Retry</button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty empty-hero">
          <div className="money-card is-empty" aria-hidden="true">
            <span className="mc-label">Money out on review products</span>
            <span className="mc-big">₹0</span>
          </div>
          <h3>Track every product you review</h3>
          <p>Bought, sent by a brand, or a paid collab. See what to film, what to post, what to return before the window closes, and which refunds or payments are still owed.</p>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" size={16} /> Add your first product
          </button>
        </div>
      ) : (
        <>
          <div className="home-top">
            <section className="money-card" aria-label="Money">
              <span className="mc-label">Money out on review products</span>
              <span className="mc-big num">{formatMoney(s.moneyOut)}</span>
              <span className="mc-sub">still to come back to you</span>
              <div className="mc-split">
                <div>
                  <b className="num">{formatMoney(s.atStake)}</b>
                  <span>to return in time</span>
                </div>
                <div>
                  <b className="num">{formatMoney(s.refundsPending)}</b>
                  <span>refunds pending</span>
                </div>
                <div>
                  <b className="num">{formatMoney(s.paymentsDue)}</b>
                  <span>collab payments due</span>
                </div>
              </div>
            </section>

            <div className="tiles">
              {tiles.map((t) => (
                <Link key={t.key} href={t.href} className={`tile ${t.tone ?? ""}`}>
                  <span className="tile-top">
                    <span className="tile-value num">{t.value}</span>
                    <span className="tile-icon" aria-hidden="true"><Icon name={t.icon} size={16} /></span>
                  </span>
                  <span className="tile-label">{t.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Needs you</h2>
              {needsYou.length > NEEDS_YOU_LIMIT && <Link href="/products" className="section-link">See all {needsYou.length}</Link>}
            </div>
            {needsYou.length ? (
              <div className="stack">
                {needsYou.slice(0, NEEDS_YOU_LIMIT).map((p) => <ProductRow key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="empty empty-sm">
                <div className="empty-art is-ok" aria-hidden="true"><Icon name="check" size={24} /></div>
                <h3>All caught up</h3>
                <p>Nothing to film, post, return or chase right now.</p>
              </div>
            )}
          </section>

          {onTheWay.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">On the way</h2>
                <span className="section-count num">{onTheWay.length}</span>
              </div>
              <div className="stack">
                {onTheWay.map((p) => <ProductRow key={p.id} product={p} compact />)}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
