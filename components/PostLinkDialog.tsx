"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductView } from "@/lib/products";
import { Icon } from "./Icon";

/** Asks for the post link when a product is marked as posted. The link is optional. */
export function PostLinkDialog({
  product,
  onClose,
  onSave,
}: {
  product: ProductView | null;
  onClose: () => void;
  onSave: (postUrl: string) => Promise<string | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (product && !el.open) {
      setLink(product.postUrl ?? "");
      setError("");
      el.showModal();
    } else if (!product && el.open) {
      el.close();
    }
  }, [product]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await onSave(link.trim());
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="post-title">
      <form className="modal-inner" onSubmit={submit}>
        <div className="modal-head">
          <h2 id="post-title">Mark as posted</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <p className="muted" style={{ fontSize: 14 }}>{product?.title}</p>
        {error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {error}</div>}
        <div className="field">
          <label className="label" htmlFor="post-link">Link to the post <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <input id="post-link" className="input" type="url" placeholder="Instagram, YouTube or blog link" value={link} onChange={(e) => setLink(e.target.value)} autoFocus />
          <span className="hint">Keeps your proof of posting in one place, handy for brands.</span>
        </div>
        <div className="modal-foot">
          <span />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Mark posted"}</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
