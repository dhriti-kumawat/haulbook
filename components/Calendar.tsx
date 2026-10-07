"use client";

import { useMemo, useState } from "react";
import type { Deadline, ProductView } from "@/lib/products";
import { Icon } from "./Icon";
import { ProductThumb } from "./ProductThumb";
import { deadlineTone } from "./ProductRow";
import { useProducts } from "./ProductsProvider";

interface Entry {
  product: ProductView;
  deadline: Deadline;
}

const KIND_LABEL: Record<Deadline["kind"], string> = {
  return: "Return",
  post: "Post",
  refund: "Refund due",
  payment: "Payment due",
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function useEntries(products: ProductView[]) {
  return useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const product of products) {
      for (const deadline of product.deadlines) {
        if (deadline.kind === "return" && deadline.days < 0) continue; // closed windows are history
        const key = dayKey(new Date(deadline.date));
        map.set(key, [...(map.get(key) ?? []), { product, deadline }]);
      }
    }
    return map;
  }, [products]);
}

/** Month grid of deadlines (wide screens) or an agenda list (phones). */
export function Calendar({ products, agenda }: { products: ProductView[]; agenda: boolean }) {
  const { openProduct } = useProducts();
  const entries = useEntries(products);
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  if (agenda) {
    const days = [...entries.entries()]
      .map(([key, list]) => ({ date: new Date(list[0].deadline.date), list }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (!days.length) return <div className="empty empty-sm"><h3>No dates coming up</h3><p>Return windows and posting deadlines appear here.</p></div>;
    return (
      <div className="agenda">
        {days.map(({ date, list }) => {
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <section key={dayKey(date)} className={`agenda-day ${isPast ? "is-past" : ""}`}>
              <h3 className="agenda-date">
                <span className="num">{date.getDate()}</span>
                <span>
                  {new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(date)}
                  <small>{new Intl.DateTimeFormat("en-IN", { month: "long" }).format(date)}</small>
                </span>
              </h3>
              <div className="stack">
                {list.map(({ product, deadline }) => (
                  <button key={product.id + deadline.kind} type="button" className="agenda-item" onClick={() => openProduct(product.id)}>
                    <ProductThumb title={product.title} imageUrl={product.imageUrl} size={40} />
                    <span className="agenda-text">
                      <b>{product.title}</b>
                      <span className={`deadline ${deadlineTone(deadline)}`}><b>{deadline.label}</b></span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  const first = new Date(month);
  // Weeks start on Monday.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const weeks = cells[35].getMonth() !== month.getMonth() ? cells.slice(0, 35) : cells;

  return (
    <div className="cal">
      <div className="cal-head">
        <h2>{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(month)}</h2>
        <div className="cal-nav">
          <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <Icon name="chevronLeft" size={18} />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
          <button type="button" className="icon-btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </div>
      <div className="cal-grid" role="grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="cal-dow" role="columnheader">{d}</div>
        ))}
        {weeks.map((d) => {
          const list = entries.get(dayKey(d)) ?? [];
          const isToday = dayKey(d) === dayKey(today);
          return (
            <div key={d.toISOString()} role="gridcell" className={`cal-cell ${d.getMonth() !== month.getMonth() ? "is-other" : ""} ${isToday ? "is-today" : ""}`}>
              <span className="cal-num num">{d.getDate()}</span>
              {list.slice(0, 3).map(({ product, deadline }) => (
                <button
                  key={product.id + deadline.kind}
                  type="button"
                  className={`cal-chip ${deadlineTone(deadline)}`}
                  title={`${KIND_LABEL[deadline.kind]}: ${product.title}`}
                  onClick={() => openProduct(product.id)}
                >
                  <span className="cal-chip-kind">{KIND_LABEL[deadline.kind]}</span> {product.title}
                </button>
              ))}
              {list.length > 3 && <span className="cal-more">+{list.length - 3} more</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
