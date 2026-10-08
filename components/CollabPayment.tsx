"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import type { ProductView } from "@/lib/products";
import { followUpMessage } from "@/lib/billing";
import { Icon } from "./Icon";
import { ProChip, useHasPro } from "./ProGate";

/** In a paid collab's details: make the invoice, and chase a late payment with a ready message. */
export function CollabPayment({ product }: { product: ProductView }) {
  const pro = useHasPro();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const unpaid = Boolean(product.postedAt && !product.paidAt);

  function start() {
    setText(followUpMessage(product, session?.user?.name ?? null));
    setOpen(true);
  }
  async function copy() {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const subject = `Payment for ${product.title}`;

  return (
    <section className="field">
      <span className="sheet-label">Invoice and payment {!pro && <ProChip />}</span>
      <div className="collab-actions">
        <Link href={pro ? `/invoice/${product.id}` : "/pro"} className="btn btn-secondary btn-sm">
          <Icon name="download" size={14} /> {product.paidAt ? "Invoice (paid)" : "Invoice"}
        </Link>
        {unpaid && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={pro ? start : undefined} disabled={!pro} aria-expanded={open}>
            <Icon name="send" size={14} /> Payment reminder
          </button>
        )}
      </div>
      {unpaid && product.urgent?.kind === "payment" && <span className="hint">{product.urgent.label}. A friendly reminder usually does it.</span>}
      {open && (
        <div className="followup">
          <label className="label" htmlFor="followup-text">Message (edit before sending)</label>
          <textarea id="followup-text" className="input textarea" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="collab-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
            <a className="btn btn-secondary btn-sm" href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>Email</a>
            <a className="btn btn-secondary btn-sm" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      )}
    </section>
  );
}
