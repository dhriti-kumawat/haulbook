"use client";

import { useEffect, useRef, useState } from "react";
import { PLATFORMS } from "@/lib/format";
import { Icon } from "./Icon";
import { useProducts, type SavedShop } from "./ProductsProvider";

/** Add a shop, or edit one (pass `shop`). `initialName` prefills a shop seen on orders but not saved yet. */
export function ShopDialog({
  open,
  shop,
  initialName,
  onClose,
}: {
  open: boolean;
  shop?: SavedShop | null;
  initialName?: string;
  onClose: () => void;
}) {
  const { saveShop, removeShop } = useProducts();
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState("7");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      const preset = PLATFORMS.find((p) => p.name.toLowerCase() === (shop?.name ?? initialName ?? "").toLowerCase());
      setName(shop?.name ?? initialName ?? "");
      setDays(String(shop?.policyDays ?? preset?.policyDays ?? 7));
      setError("");
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open, shop, initialName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await saveShop({ id: shop?.id, name, policyDays: Number(days) });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="shop-dialog-title">
      <form className="modal-inner" onSubmit={submit}>
        <div className="modal-head">
          <h2 id="shop-dialog-title">{shop ? "Edit shop or brand" : "Add a shop or brand"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        {error && (
          <div className="alert" role="alert">
            <Icon name="alert" size={16} /> {error}
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="shop-name">Name</label>
          <input
            id="shop-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. H&M, Croma, or a brand"
            autoComplete="off"
            required
            maxLength={40}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="shop-days">Return window</label>
          <div className="unit-input days" style={{ maxWidth: 160 }}>
            <input
              id="shop-days"
              className="input num"
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
            <span>days</span>
          </div>
          <span className="hint">Filled in when you add a product from here. You can change it per product.</span>
        </div>

        <div className="modal-foot">
          {shop ? (
            <button
              type="button"
              className="btn btn-danger-ghost"
              onClick={async () => {
                await removeShop(shop);
                onClose();
              }}
            >
              Remove
            </button>
          ) : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : shop ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
