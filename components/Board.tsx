"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductView } from "@/lib/products";
import { TYPE_LABEL } from "@/lib/products";
import { BUCKET_LABEL, bucketOf, urgencyScore, type Bucket } from "@/lib/summary";
import { canMoveTo } from "@/lib/move";
import { formatMoney } from "@/lib/format";
import { Icon } from "./Icon";
import { ProductThumb } from "./ProductThumb";
import { deadlineTone } from "./ProductRow";
import { MoveMenu } from "./MoveMenu";
import { useProducts } from "./ProductsProvider";

const COLUMNS: Bucket[] = ["receive", "film", "post", "return", "money"];

const EMPTY_TEXT: Record<Bucket, string> = {
  receive: "Nothing on the way",
  film: "Nothing waiting to be filmed",
  post: "Nothing waiting to be posted",
  return: "Nothing to send back",
  money: "No refunds or payments pending",
  done: "",
};

function BoardCard({
  product,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  product: ProductView;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const { completeStep, openProduct, busyId } = useProducts();
  const d = product.urgent;
  const amount = product.type === "collab" ? product.fee : product.price;

  return (
    <article
      className={`bcard ${dragging ? "is-dragging" : ""}`}
      aria-label={product.title}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", product.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="bcard-tools">
        <span className="bcard-grip" aria-hidden="true" title="Drag to another column"><Icon name="grip" size={14} /></span>
        <MoveMenu product={product} />
      </div>
      <button type="button" className="bcard-main" onClick={() => openProduct(product.id)} aria-label={`${product.title}. Open details`}>
        <span className="bcard-photo">
          <ProductThumb title={product.title} imageUrl={product.imageUrl} size={220} />
        </span>
        <span className="bcard-title">{product.title}</span>
        <span className="bcard-meta">
          <span className={`type type-${product.type}`}>{TYPE_LABEL[product.type]}</span>
          {product.shop && <span className="bcard-shop">{product.shop}</span>}
          {amount != null && <span className="num">{formatMoney(amount)}</span>}
        </span>
        {d && <span className={`deadline-chip ${deadlineTone(d)}`}>{d.label}</span>}
      </button>
      {product.next.kind === "step" && (
        <button
          type="button"
          className="bcard-next"
          disabled={busyId === product.id}
          onClick={() => product.next.kind === "step" && completeStep(product, product.next.step)}
        >
          {product.next.label}
          <Icon name="chevronRight" size={14} />
        </button>
      )}
    </article>
  );
}

/**
 * Products in columns by their current step.
 * Drag a card to another column (desktop), use its "Move to" menu, or tap its next-step bar.
 */
export function Board({ products }: { products: ProductView[] }) {
  const { moveProduct } = useProducts();
  const done = products.filter((p) => bucketOf(p) === "done").length;
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragged, setDragged] = useState<ProductView | null>(null);
  const [over, setOver] = useState<Bucket | null>(null);

  // On narrow screens only one column shows at a time, so open at the first one with products.
  useEffect(() => {
    const board = boardRef.current;
    if (!board || board.scrollWidth <= board.clientWidth) return;
    const first = board.querySelector<HTMLElement>(".board-col:not(.is-empty)");
    if (first) board.scrollTo({ left: first.offsetLeft - parseFloat(getComputedStyle(board).paddingLeft), behavior: "auto" });
    // Only when the board first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dropState(col: Bucket) {
    if (!dragged) return "";
    if (bucketOf(dragged) === col) return "is-source";
    return canMoveTo(dragged, col) ? (over === col ? "is-over" : "is-drop-ok") : "is-drop-blocked";
  }

  function dropProps(col: Bucket) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (!dragged || bucketOf(dragged) === col || !canMoveTo(dragged, col)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (over !== col) setOver(col);
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setOver((o) => (o === col ? null : o));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const product = dragged;
        setDragged(null);
        setOver(null);
        if (product) moveProduct(product, col);
      },
    };
  }

  return (
    <div className={`board-wrap ${dragged ? "is-dragging" : ""}`}>
      <div className="board" role="list" ref={boardRef}>
        {COLUMNS.map((col) => {
          const items = products.filter((p) => bucketOf(p) === col).sort((a, b) => urgencyScore(a) - urgencyScore(b));
          return (
            <section
              key={col}
              className={`board-col col-${col} ${items.length ? "" : "is-empty"} ${dropState(col)}`}
              role="listitem"
              aria-label={`${BUCKET_LABEL[col]}: ${items.length}`}
              {...dropProps(col)}
            >
              <header className="board-col-head">
                <span>{BUCKET_LABEL[col]}</span>
                <span className="num">{items.length}</span>
              </header>
              <div className="board-col-body">
                {items.length ? (
                  items.map((p) => (
                    <BoardCard
                      key={p.id}
                      product={p}
                      dragging={dragged?.id === p.id}
                      onDragStart={() => setDragged(p)}
                      onDragEnd={() => {
                        setDragged(null);
                        setOver(null);
                      }}
                    />
                  ))
                ) : (
                  <p className="board-empty">{EMPTY_TEXT[col]}</p>
                )}
              </div>
            </section>
          );
        })}

        <section className={`board-col board-done ${dropState("done")}`} role="listitem" aria-label={`Done: ${done}`} {...dropProps("done")}>
          <header className="board-col-head">
            <span>Done</span>
            <span className="num">{done}</span>
          </header>
          <div className="board-done-body">
            <Icon name="check" size={20} />
            <p>{dragged ? "Drop here to finish" : `${done} finished`}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
