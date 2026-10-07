"use client";

import type { Deadline, ProductView } from "@/lib/products";
import { TYPE_LABEL } from "@/lib/products";
import { formatDate, formatMoney } from "@/lib/format";
import { Icon } from "./Icon";
import { ProductThumb } from "./ProductThumb";
import { useProducts } from "./ProductsProvider";
import { MoveMenu } from "./MoveMenu";
import { useRef, useState } from "react";

const SWIPE_TRIGGER = 80;
const SWIPE_MAX = 120;

export function deadlineTone(d: Deadline | null) {
  if (!d) return "";
  if (d.days < 0) return "is-late";
  if (d.days <= 3) return "is-urgent";
  if (d.days <= 7) return "is-soon";
  return "";
}

export function StepBar({ product }: { product: ProductView }) {
  return (
    <span className="stepbar" aria-label={`${product.steps.filter((s) => s.done).length} of ${product.steps.length} steps done`}>
      {product.steps.map((s) => (
        <i key={s.key} className={s.done ? "is-done" : ""} title={s.key} />
      ))}
    </span>
  );
}

function amountLine(p: ProductView) {
  if (p.type === "collab" && p.fee != null) return `Fee ${formatMoney(p.fee)}`;
  if (p.price != null) return formatMoney(p.price);
  return p.deliverables ?? null;
}

export function ProductRow({
  product,
  compact = false,
  selecting = false,
  selected = false,
  onToggleSelect,
}: {
  product: ProductView;
  compact?: boolean;
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { completeStep, keepProduct, openProduct, busyId } = useProducts();
  const d = product.urgent;
  const busy = busyId === product.id;
  const amount = amountLine(product);
  const canKeep = product.next.kind === "step" && product.next.step === "returned";

  // Touch swipe: right does the next step, left opens "Move to". Vertical scrolling is left to the browser.
  const [dx, setDx] = useState(0);
  const [moveSignal, setMoveSignal] = useState(0);
  const swipe = useRef<{ x: number; y: number; axis: "x" | "y" | null; dx: number } | null>(null);
  const swiped = useRef(false);
  const canNext = product.next.kind === "step" && !busy;
  // Short form for the swipe reveal: "Mark posted" → "Posted".
  const nextLabel = product.next.kind === "step" ? product.next.label.replace(/^Mark (\w)/, (_, c: string) => c.toUpperCase()) : "";

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "touch" || selecting) return;
    swipe.current = { x: e.clientX, y: e.clientY, axis: null, dx: 0 };
    swiped.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = swipe.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      s.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
    }
    if (s.axis !== "x") return;
    swiped.current = true;
    const v = mx > 0 && !canNext ? mx / 4 : mx;
    s.dx = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, v));
    setDx(s.dx);
  }
  function onPointerEnd() {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.axis !== "x") return;
    if (s.dx >= SWIPE_TRIGGER && canNext && product.next.kind === "step") completeStep(product, product.next.step);
    else if (s.dx <= -SWIPE_TRIGGER) setMoveSignal((n) => n + 1);
    setDx(0);
  }

  return (
    <div className={`swipe ${dx > 0 ? "is-right" : dx < 0 ? "is-left" : ""}`}>
      {dx !== 0 && (
        <div className="swipe-bg" aria-hidden="true">
          <span className={`swipe-next ${dx >= SWIPE_TRIGGER ? "is-ready" : ""}`}><Icon name="check" size={16} /> {canNext ? nextLabel : "Nothing next"}</span>
          <span className={`swipe-move ${dx <= -SWIPE_TRIGGER ? "is-ready" : ""}`}>Move <Icon name="dots" size={16} /></span>
        </div>
      )}
    <article
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(e) => {
        if (swiped.current) {
          e.preventDefault();
          e.stopPropagation();
          swiped.current = false;
        }
      }}
      style={dx ? { transform: `translateX(${dx}px)`, transition: "none" } : undefined}
      className={`prow ${compact ? "is-compact" : ""} ${selecting ? "is-selecting" : ""} ${selected ? "is-selected" : ""}`} aria-label={product.title}>
      {selecting && (
        <span className="check select-check" aria-hidden="true" data-on={selected}>
          <Icon name="check" size={13} />
        </span>
      )}
      <button
        type="button"
        className="prow-main"
        onClick={() => (selecting ? onToggleSelect?.() : openProduct(product.id))}
        aria-label={selecting ? `${selected ? "Deselect" : "Select"} ${product.title}` : `${product.title}. Open details`}
        aria-pressed={selecting ? selected : undefined}
      >
        <ProductThumb title={product.title} imageUrl={product.imageUrl} size={compact ? 44 : 56} />
        <span className="prow-text">
          <span className="prow-title">{product.title}</span>
          <span className="prow-meta">
            <span className={`type type-${product.type}`}>{TYPE_LABEL[product.type]}</span>
            {product.shop && <span>{product.shop}</span>}
            {amount && (
              <>
                <span className="dot" aria-hidden="true" />
                <span className="num">{amount}</span>
              </>
            )}
          </span>
          {!compact && <StepBar product={product} />}
        </span>
      </button>

      {!selecting && <div className="prow-side">
        {d ? (
          <span className={`deadline ${deadlineTone(d)}`}>
            <b>{d.label}</b>
            <span>{d.kind === "refund" || d.kind === "payment" ? `since ${formatDate(product.returnedAt ?? product.postedAt!)}` : formatDate(d.date)}</span>
          </span>
        ) : product.stage === "done" ? (
          <span className="deadline is-done"><b>Done</b><span>{product.keptAt ? "Kept" : "All steps complete"}</span></span>
        ) : null}

        <span className="prow-actions">
          <MoveMenu product={product} pill align="left" openSignal={moveSignal} />
          {canKeep && (
            <button type="button" className="btn btn-quiet btn-sm" disabled={busy} onClick={() => keepProduct(product)}>
              Keep it
            </button>
          )}
          {product.next.kind === "step" && (
            <button
              type="button"
              className={`btn btn-sm ${d && d.days <= 3 ? "btn-primary" : "btn-secondary"}`}
              disabled={busy}
              onClick={() => product.next.kind === "step" && completeStep(product, product.next.step)}
            >
              {product.next.label}
              <Icon name="chevronRight" size={14} />
            </button>
          )}
        </span>
      </div>}
    </article>
    </div>
  );
}
