"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductType, ProductView, StepKey } from "@/lib/products";
import { PRODUCT_TYPES, STEP_FIELD, STEP_LABEL, TYPE_LABEL } from "@/lib/products";
import { formatDate, localDay } from "@/lib/format";
import { Icon } from "./Icon";
import { ProductThumb } from "./ProductThumb";
import { deadlineTone } from "./ProductRow";
import { useProducts } from "./ProductsProvider";
import { patchForStep } from "@/lib/move";
import { PhotoPicker } from "./PhotoPicker";
import { FieldError } from "./FieldError";
import { CollabPayment } from "./CollabPayment";
import { LIMITS, validateProduct, type FieldErrors } from "@/lib/productValidate";

const dateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/** Form field → input id, in the order they appear, for focusing the first problem. */
const FIELD_IDS: [keyof FieldErrors, string][] = [
  ["title", "p-title"], ["shop", "p-shop"], ["price", "p-price"], ["fee", "p-fee"], ["returnWindowDays", "p-window"],
  ["postBy", "p-postby"], ["deliverables", "p-deliv"], ["url", "p-url"], ["postUrl", "p-post"], ["notes", "p-notes"],
];


interface Form {
  title: string;
  type: ProductType;
  shop: string;
  price: string;
  fee: string;
  deliverables: string;
  returnWindowDays: string;
  postBy: string;
  url: string;
  imageUrl: string;
  postUrl: string;
  notes: string;
}

function toForm(p: ProductView): Form {
  return {
    title: p.title,
    type: p.type,
    shop: p.shop ?? "",
    price: p.price != null ? String(p.price) : "",
    fee: p.fee != null ? String(p.fee) : "",
    deliverables: p.deliverables ?? "",
    returnWindowDays: p.returnWindowDays != null ? String(p.returnWindowDays) : "",
    postBy: dateInput(p.postBy),
    url: p.url ?? "",
    imageUrl: p.imageUrl ?? "",
    postUrl: p.postUrl ?? "",
    notes: p.notes ?? "",
  };
}

export function ProductSheet({ product, onClose }: { product: ProductView | null; onClose: () => void }) {
  const { updateProduct, deleteProduct, shops, busyId } = useProducts();
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [discardArmed, setDiscardArmed] = useState(false);
  const productId = product?.id;

  useEffect(() => {
    if (product) {
      setForm(toForm(product));
      setError("");
      setStatus("idle");
      setTouched(new Set());
      setShowAll(false);
      setDiscardArmed(false);
    }
    // Reload the form only when a different product opens, so typing is not lost on step updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (product && !el.open) {
      el.showModal();
      el.querySelector(".sheet-body")?.scrollTo(0, 0);
    }
    if (!product && el.open) el.close();
  }, [product]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDiscardArmed(false);
    setError("");
  };
  const errors: FieldErrors = form ? validateProduct(form) : {};
  const errorCount = Object.keys(errors).length;
  const errorFor = (key: keyof FieldErrors) => (showAll || touched.has(key) ? errors[key] : undefined);
  /** Props that mark an input invalid and link it to its message. */
  const check = (key: keyof FieldErrors, id: string) => {
    const message = errorFor(key);
    return {
      "aria-invalid": Boolean(message),
      "aria-describedby": message ? `${id}-error` : undefined,
      onBlur: () => setTouched((t) => (t.has(key) ? t : new Set(t).add(key))),
    };
  };

  function focusFirstError() {
    const first = FIELD_IDS.find(([key]) => errors[key]);
    const el = first && document.getElementById(first[1]);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }
  const dirty = product && form && JSON.stringify(form) !== JSON.stringify(toForm(product));

  // Details save with the Save button, and on their own when the panel closes, so nothing typed is lost.
  async function save() {
    if (!product || !form || !dirty) return;
    if (errorCount) {
      setShowAll(true);
      focusFirstError();
      return;
    }
    setError("");
    setStatus("saving");
    const err = await updateProduct(product.id, {
      ...form,
      price: form.price || null,
      fee: form.fee || null,
      returnWindowDays: form.returnWindowDays || null,
      postBy: form.postBy || null,
    });
    if (err) {
      setError(err);
      setStatus("idle");
    } else setStatus("saved");
  }

  // One button tells the whole story: "Save changes" when there is something to save,
  // "Saving…" while any change (including a ticked step) is on its way, "Saved" otherwise.
  const saveState: "invalid" | "dirty" | "saving" | "saved" =
    status === "saving" || (product && busyId === product.id) ? "saving" : dirty ? (showAll && errorCount ? "invalid" : "dirty") : "saved";

  // Closing saves pending edits. If they can't be saved, the first close points at the problem
  // and a second close discards them, so nobody is trapped and nothing is lost silently.
  function close() {
    if (dirty && errorCount && !discardArmed) {
      setShowAll(true);
      setDiscardArmed(true);
      focusFirstError();
      return;
    }
    if (dirty && !errorCount) save();
    onClose();
  }

  function toggleStep(step: StepKey, done: boolean) {
    if (!product) return;
    // Keep the steps consistent, so the card's step ("On the way", "To film"…) always matches the ticks.
    updateProduct(product.id, patchForStep(product, step, done));
  }

  function setStepDate(step: StepKey, value: string) {
    if (!product || !value) return;
    if (new Date(value) > new Date()) {
      setError("Step dates can't be in the future.");
      return;
    }
    updateProduct(product.id, { [STEP_FIELD[step]]: new Date(value).toISOString() });
  }

  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={close}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
      aria-labelledby="sheet-title"
    >
      {product && form && (
        <div className="sheet-inner">
          <div className="sheet-head">
            <ProductThumb title={product.title} imageUrl={product.imageUrl} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id="sheet-title" className="sheet-title">{product.title}</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {TYPE_LABEL[product.type]}
                {product.shop ? ` · ${product.shop}` : ""} · added {formatDate(product.orderedAt)}
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={close} aria-label="Close" autoFocus>
              <Icon name="x" />
            </button>
          </div>

          <div className="sheet-body">
            {product.deadlines.length > 0 && (
              <div className="sheet-deadlines">
                {product.deadlines.map((d) => (
                  <span key={d.kind} className={`deadline-chip ${deadlineTone(d)}`}>
                    {d.label} · {formatDate(d.date)}
                  </span>
                ))}
              </div>
            )}

            <section className="field">
              <span className="sheet-label">Progress</span>
              <span className="hint">Tick a step when it&apos;s done. Ticks save straight away.</span>
              <ol className="checklist">
                {product.steps.map((s) => (
                  <li key={s.key} className={s.done ? "is-done" : ""}>
                    <button
                      type="button"
                      className="check"
                      aria-pressed={s.done}
                      aria-label={s.done ? `Undo ${STEP_LABEL[s.key]}` : `Mark ${STEP_LABEL[s.key].toLowerCase()}`}
                      onClick={() => toggleStep(s.key, !s.done)}
                    >
                      <Icon name="check" size={13} />
                    </button>
                    <span className="checklist-label">{STEP_LABEL[s.key]}</span>
                    {s.done ? (
                      <input
                        type="date"
                        className="input input-sm"
                        aria-label={`${STEP_LABEL[s.key]} on`}
                        value={s.at ? localDay(s.at) : ""}
                        max={localDay()}
                        onChange={(e) => setStepDate(s.key, e.target.value)}
                      />
                    ) : (
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => toggleStep(s.key, true)}>
                        Mark {STEP_LABEL[s.key].toLowerCase()}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              {product.type === "bought" && !product.returnedAt && (
                <label className="keep-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(product.keptAt)}
                    onChange={(e) => updateProduct(product.id, { keptAt: e.target.checked ? new Date().toISOString() : null })}
                  />
                  Keeping it (no return)
                </label>
              )}
            </section>

            {product.type === "collab" && <CollabPayment product={product} />}

            <section className="field">
              <span className="sheet-label">Details</span>
              <PhotoPicker title={form.title} imageUrl={form.imageUrl || null} onChange={(img) => set("imageUrl", img ?? "")} size={72} />
              <div className="field">
                <label className="label" htmlFor="p-title">Title</label>
                <input id="p-title" className="input" value={form.title} maxLength={LIMITS.title + 20} onChange={(e) => set("title", e.target.value)} {...check("title", "p-title")} />
                <FieldError id="p-title" message={errorFor("title")} />
              </div>
              <div className="field">
                <span className="label" id="p-type">Type</span>
                <div className="seg" role="group" aria-labelledby="p-type">
                  {PRODUCT_TYPES.map((t) => (
                    <button key={t} type="button" aria-pressed={form.type === t} onClick={() => set("type", t)}>
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label className="label" htmlFor="p-shop">{form.type === "bought" ? "Shop" : "Brand"}</label>
                  <input id="p-shop" className="input" list="p-shops" value={form.shop} onChange={(e) => set("shop", e.target.value)} {...check("shop", "p-shop")} />
                  <FieldError id="p-shop" message={errorFor("shop")} />
                  <datalist id="p-shops">{shops.map((s) => <option key={s.id} value={s.name} />)}</datalist>
                </div>
                {form.type === "collab" ? (
                  <div className="field">
                    <label className="label" htmlFor="p-fee">Fee (₹)</label>
                    <input id="p-fee" className="input num" type="number" min={0} step="0.01" inputMode="decimal" value={form.fee} onChange={(e) => set("fee", e.target.value)} {...check("fee", "p-fee")} />
                    <FieldError id="p-fee" message={errorFor("fee")} />
                  </div>
                ) : (
                  <div className="field">
                    <label className="label" htmlFor="p-price">{form.type === "bought" ? "Price paid (₹)" : "Value (₹)"}</label>
                    <input id="p-price" className="input num" type="number" min={0} step="0.01" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} {...check("price", "p-price")} />
                    <FieldError id="p-price" message={errorFor("price")} />
                  </div>
                )}
              </div>
              {form.type === "bought" ? (
                <div className="field">
                  <label className="label" htmlFor="p-window">Return window (days after delivery)</label>
                  <input id="p-window" className="input num" type="number" min={0} max={365} step={1} inputMode="numeric" value={form.returnWindowDays} onChange={(e) => set("returnWindowDays", e.target.value)} style={{ maxWidth: 160 }} {...check("returnWindowDays", "p-window")} />
                  <FieldError id="p-window" message={errorFor("returnWindowDays")} />
                  {!errorFor("returnWindowDays") && product.returnBy && <span className="hint">Return by {formatDate(product.returnBy)}</span>}
                </div>
              ) : (
                <div className="field-row">
                  <div className="field">
                    <label className="label" htmlFor="p-postby">Post by</label>
                    <input id="p-postby" className="input" type="date" value={form.postBy} onChange={(e) => set("postBy", e.target.value)} {...check("postBy", "p-postby")} />
                    <FieldError id="p-postby" message={errorFor("postBy")} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="p-deliv">Deliverables</label>
                    <input id="p-deliv" className="input" placeholder="e.g. 1 Reel + 2 stories" value={form.deliverables} onChange={(e) => set("deliverables", e.target.value)} {...check("deliverables", "p-deliv")} />
                    <FieldError id="p-deliv" message={errorFor("deliverables")} />
                  </div>
                </div>
              )}
            </section>

            <section className="field">
              <span className="sheet-label">Links</span>
              <div className="field">
                <label className="label" htmlFor="p-url">Product link</label>
                <input id="p-url" className="input" type="url" inputMode="url" placeholder="https://" value={form.url} onChange={(e) => set("url", e.target.value)} {...check("url", "p-url")} />
                <FieldError id="p-url" message={errorFor("url")} />
              </div>
              <div className="field">
                <label className="label" htmlFor="p-post">Post link</label>
                <input id="p-post" className="input" type="url" inputMode="url" placeholder="Reel, YouTube or blog link" value={form.postUrl} onChange={(e) => set("postUrl", e.target.value)} {...check("postUrl", "p-post")} />
                <FieldError id="p-post" message={errorFor("postUrl")} />
              </div>
            </section>

            <section className="field">
              <label className="sheet-label" htmlFor="p-notes">Notes</label>
              <textarea id="p-notes" className="input textarea" rows={3} placeholder="Talking points, discount code, brand contact…" value={form.notes} onChange={(e) => set("notes", e.target.value)} {...check("notes", "p-notes")} />
              <FieldError id="p-notes" message={errorFor("notes")} />
              {form.notes.length > LIMITS.notes - 200 && <span className="hint">{form.notes.length} / {LIMITS.notes}</span>}
            </section>
          </div>

          {(error || discardArmed || saveState === "invalid") && (
            <div className="sheet-msg" role="alert">
              <Icon name="alert" size={15} />
              <span>
                {error ||
                  (discardArmed
                    ? "These changes can't be saved yet. Fix the highlighted field, or close again to discard them."
                    : `Fix ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`} to save.`)}
              </span>
            </div>
          )}
          <div className="sheet-foot">
            <button type="button" className="btn btn-danger-ghost" onClick={() => deleteProduct(product)}>
              <Icon name="trash" size={16} /> Delete
            </button>
            <button
              type="button"
              className={`btn save-btn ${saveState === "dirty" ? "btn-primary" : saveState === "invalid" ? "is-invalid" : saveState === "saving" ? "btn-secondary is-saving" : "is-saved"}`}
              onClick={saveState === "invalid" ? focusFirstError : save}
              aria-disabled={saveState !== "dirty" && saveState !== "invalid"}
              aria-live="polite"
            >
              {saveState === "saving" ? (
                <><span className="save-spinner" aria-hidden="true" /> Saving…</>
              ) : saveState === "invalid" ? (
                `Fix ${errorCount} field${errorCount === 1 ? "" : "s"}`
              ) : saveState === "dirty" ? (
                "Save changes"
              ) : (
                <><Icon name="check" size={15} /> Saved</>
              )}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
