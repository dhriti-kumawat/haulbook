"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductView } from "@/lib/products";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { ShopDialog } from "@/components/ShopDialog";
import { deadlineTone } from "@/components/ProductRow";
import { useProducts, type SavedShop } from "@/components/ProductsProvider";

interface ShopSummary {
  name: string;
  saved: SavedShop | null;
  products: ProductView[];
  active: number;
  spent: number;
  next: ProductView | null;
}

const QUICK_WINDOWS = [7, 10, 15, 30];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function ShopsPage() {
  const { products, shops: savedShops, loading, saveShop } = useProducts();
  const [savingShop, setSavingShop] = useState<string | null>(null);

  async function quickWindow(name: string, days: number) {
    setSavingShop(name);
    await saveShop({ name, policyDays: days });
    setSavingShop(null);
  }
  const [dialog, setDialog] = useState<{ shop?: SavedShop | null; name?: string } | null>(null);

  const shops = useMemo<ShopSummary[]>(() => {
    const map = new Map<string, ShopSummary>();
    const blank = (name: string, saved: SavedShop | null): ShopSummary => ({ name, saved, products: [], active: 0, spent: 0, next: null });
    for (const saved of savedShops) map.set(saved.name.toLowerCase(), blank(saved.name, saved));
    for (const p of products) {
      if (!p.shop) continue;
      const key = p.shop.toLowerCase();
      const s = map.get(key) ?? blank(p.shop, null);
      s.products.push(p);
      if (p.stage !== "done") s.active += 1;
      s.spent += p.type === "bought" ? p.price ?? 0 : 0;
      if (p.urgent && (!s.next || p.urgent.days < s.next.urgent!.days)) s.next = p;
      map.set(key, s);
    }
    return [...map.values()].sort(
      (a, b) => (a.next?.urgent?.days ?? 999) - (b.next?.urgent?.days ?? 999) || b.products.length - a.products.length || a.name.localeCompare(b.name)
    );
  }, [products, savedShops]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Shops & brands</h1>
          <p className="page-sub">{loading ? "Loading…" : "Where your products come from, and their return windows."}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setDialog({})}>
          <Icon name="plus" size={16} /> Add
        </button>
      </div>

      {loading ? (
        <div className="shop-grid" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
        </div>
      ) : (
        <div className="shop-grid">
          {shops.map((s) => (
            <div key={s.name} className="shop-card">
              <div className="shop-card-head">
                <span className="shop-avatar" aria-hidden="true">{initials(s.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/products?shop=${encodeURIComponent(s.name)}`} className="shop-name">{s.name}</Link>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {s.saved
                      ? `${s.saved.policyDays}-day returns`
                      : s.products.some((p) => p.type === "bought")
                        ? "Return window not set yet"
                        : "Gifted and paid products only"}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={s.saved ? `Edit ${s.name}` : `Set return window for ${s.name}`}
                  onClick={() => setDialog(s.saved ? { shop: s.saved } : { name: s.name })}
                >
                  <Icon name="pencil" size={15} />
                </button>
              </div>
              {!s.saved && s.products.some((p) => p.type === "bought") && (
                <div className="quick-window" role="group" aria-label={`Return window for ${s.name}`}>
                  <span>How many days does {s.name} give you to return?</span>
                  {QUICK_WINDOWS.map((d) => (
                    <button key={d} type="button" disabled={savingShop === s.name} onClick={() => quickWindow(s.name, d)}>
                      {d} days
                    </button>
                  ))}
                </div>
              )}
              <Link href={`/products?shop=${encodeURIComponent(s.name)}`} className="shop-card-body">
                <div className="shop-stats">
                  <div><b className="num">{s.products.length}</b><span>products</span></div>
                  <div><b className="num">{s.active}</b><span>in progress</span></div>
                  <div><b className="num">{formatMoney(s.spent)}</b><span>spent</span></div>
                </div>
                {s.next?.urgent ? (
                  <span className={`deadline-chip ${deadlineTone(s.next.urgent)}`}>
                    <span className="chip-text">{s.next.urgent.label} · {s.next.title}</span>
                  </span>
                ) : (
                  <span className="deadline-chip">{s.products.length ? "Nothing due" : "No products yet"}</span>
                )}
              </Link>
              {s.products.length > 0 && (
                <Link href={`/report?shop=${encodeURIComponent(s.name)}`} className="shop-report-link">
                  <Icon name="download" size={14} /> Brand report
                </Link>
              )}
            </div>
          ))}
          <button type="button" className="shop-card shop-card-add" onClick={() => setDialog({})}>
            <Icon name="plus" size={20} />
            <span>Add a shop or brand</span>
          </button>
        </div>
      )}

      <ShopDialog open={dialog !== null} shop={dialog?.shop} initialName={dialog?.name} onClose={() => setDialog(null)} />
    </>
  );
}
