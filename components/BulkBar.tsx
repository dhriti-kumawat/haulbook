"use client";

import { useState } from "react";
import type { ProductView } from "@/lib/products";
import { BUCKET_LABEL } from "@/lib/summary";
import { MOVABLE_BUCKETS } from "@/lib/move";
import { Icon } from "./Icon";
import { useProducts } from "./ProductsProvider";

/** Action bar for the selected products. */
export function BulkBar({
  selected,
  total,
  onSelectAll,
  onDone,
}: {
  selected: ProductView[];
  total: number;
  onSelectAll: () => void;
  onDone: () => void;
}) {
  const { moveMany, deleteMany } = useProducts();
  const [busy, setBusy] = useState(false);
  const none = selected.length === 0;

  return (
    <div className="bulk-bar" role="toolbar" aria-label="Actions for selected products">
      <span className="bulk-count">
        <b className="num">{selected.length}</b> selected
        {selected.length < total && (
          <button type="button" className="link-btn" onClick={onSelectAll}>Select all {total}</button>
        )}
      </span>
      <label className="type-select bulk-move">
        <span className="sr-only">Move selected products to</span>
        <select
          value=""
          disabled={none || busy}
          onChange={async (e) => {
            const to = e.target.value as (typeof MOVABLE_BUCKETS)[number];
            if (!to) return;
            setBusy(true);
            await moveMany(selected, to);
            setBusy(false);
            onDone();
          }}
        >
          <option value="">Move to…</option>
          {MOVABLE_BUCKETS.map((b) => <option key={b} value={b}>{BUCKET_LABEL[b]}</option>)}
        </select>
        <Icon name="chevronDown" size={14} />
      </label>
      <button
        type="button"
        className="btn btn-danger-ghost btn-sm"
        disabled={none || busy}
        onClick={() => {
          deleteMany(selected);
          onDone();
        }}
      >
        <Icon name="trash" size={14} /> Delete
      </button>
      <button type="button" className="btn btn-primary btn-sm" onClick={onDone}>Done</button>
    </div>
  );
}
