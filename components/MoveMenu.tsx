"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductView } from "@/lib/products";
import { BUCKET_LABEL, bucketOf } from "@/lib/summary";
import { MOVABLE_BUCKETS, canMoveTo } from "@/lib/move";
import { Icon } from "./Icon";
import { useProducts } from "./ProductsProvider";

/** "Move to…" menu: the touch- and keyboard-friendly way to change a product's step. */
/** Short step names for the pill on product cards. */
const SHORT: Record<string, string> = { receive: "On the way", film: "To film", post: "To post", return: "To return", money: "Money due", done: "Done" };

/**
 * `openSignal`: bump it to open the menu from outside (a swipe on the card).
 * `pill`: show the product's current step as the trigger ("To post ⌄"), so people see where it is and that it can change.
 */
export function MoveMenu({ product, label = false, pill = false, align = "right", openSignal = 0 }: { product: ProductView; label?: boolean; pill?: boolean; align?: "left" | "right"; openSignal?: number }) {
  const { moveProduct, keepProduct } = useProducts();
  const canKeep = product.next.kind === "step" && product.next.step === "returned";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = bucketOf(product);

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="move-menu" ref={ref}>
      <button
        type="button"
        className={pill ? `step-pill step-${current}` : label ? "btn btn-quiet btn-sm" : "icon-btn"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={pill ? `Step: ${BUCKET_LABEL[current]}. Change step for ${product.title}` : `Move ${product.title} to another step`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {pill ? (
          <>
            {SHORT[current]}
            <Icon name="chevronDown" size={13} />
          </>
        ) : (
          <>
            <Icon name={label ? "move" : "dots"} size={16} />
            {label && "Move"}
          </>
        )}
      </button>
      {open && <div className="move-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />}
      {open && (
        <div className={`menu move-menu-list align-${align}`} role="menu">
          <div className="menu-head menu-head-row">
            <div style={{ minWidth: 0 }}><strong>Move to</strong><span>{product.title}</span></div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close without changing">
              <Icon name="x" size={16} />
            </button>
          </div>
          {MOVABLE_BUCKETS.map((b) => {
            const allowed = canMoveTo(product, b);
            return (
              <button
                key={b}
                type="button"
                role="menuitemradio"
                aria-checked={b === current}
                className="menu-item"
                disabled={!allowed}
                onClick={() => {
                  setOpen(false);
                  // Picking the step it is already in just closes the menu.
                  if (b !== current) moveProduct(product, b);
                }}
              >
                <span className={`move-dot ${b === current ? "is-current" : ""}`} aria-hidden="true" />
                {BUCKET_LABEL[b]}
                {b === current && <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>Now · keep here</span>}
                {!allowed && <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>Not for {product.type === "pr" ? "PR" : "this type"}</span>}
              </button>
            );
          })}
          {canKeep && (
            <>
              <div className="menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setOpen(false);
                  keepProduct(product);
                }}
              >
                <Icon name="heart" size={14} /> Keep it (no return)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
