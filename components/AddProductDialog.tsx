"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductType } from "@/lib/products";
import { PRODUCT_TYPES, TYPE_LABEL } from "@/lib/products";
import { PLATFORMS, localDay } from "@/lib/format";
import { Icon } from "./Icon";
import { useProducts } from "./ProductsProvider";
import { PhotoPicker } from "./PhotoPicker";
import { shortTitle } from "@/lib/shortTitle";
import { parseShared } from "@/lib/shareText";
import { validateProduct, type FieldErrors } from "@/lib/productValidate";
import { FieldError } from "./FieldError";

/** Field → input id, in page order, for focusing the first problem. */
const FIELD_IDS: [string, string][] = [
  ["url", "add-url"], ["title", "add-name"], ["shop", "add-shop"], ["price", "add-amount"], ["fee", "add-amount"],
  ["deliveredOn", "add-arrived"], ["returnWindowDays", "add-window"], ["postBy", "add-postby"], ["deliverables", "add-deliverables"],
];

const today = () => localDay();

const TYPE_HINT: Record<ProductType, string> = {
  bought: "You paid for it and may return it for a refund.",
  pr: "A brand sent it for free. Track the posting deadline.",
  collab: "A brand is paying you. Track deliverables and payment.",
};

/**
 * `initialUrl` pre-fills the link (pasted on the landing page or shared from a shop app) and looks it up
 * straight away; `initialTitle` is the name from the shared text, kept even if the shop blocks the lookup.
 */
export function AddProductDialog({ open, onClose, initialUrl, initialTitle }: { open: boolean; onClose: () => void; initialUrl?: string | null; initialTitle?: string | null }) {
  const { createProduct, shops } = useProducts();
  const ref = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<ProductType>("bought");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [shop, setShop] = useState("");
  const [amount, setAmount] = useState("");
  const [delivered, setDelivered] = useState<"no" | "yes">("no");
  const [deliveredOn, setDeliveredOn] = useState(today());
  const [windowDays, setWindowDays] = useState("7");
  const [postBy, setPostBy] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lookup, setLookup] = useState<{ state: "idle" | "loading" | "found" | "failed"; message?: string }>({ state: "idle" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [discardArmed, setDiscardArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setType("bought");
      setUrl(initialUrl ?? "");
      setTitle(initialTitle ?? "");
      setShop("");
      setAmount("");
      setDelivered("no");
      setDeliveredOn(today());
      setWindowDays("7");
      setPostBy("");
      setDeliverables("");
      setImageUrl(null);
      setLookup({ state: "idle" });
      setError("");
      setTouched(new Set());
      setShowAll(false);
      setDiscardArmed(false);
      el.showModal();
      if (initialUrl) fetchLink(initialUrl);
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // A known shop fills in its return window.
  function pickShop(name: string) {
    setShop(name);
    const known =
      shops.find((s) => s.name.toLowerCase() === name.trim().toLowerCase()) ??
      PLATFORMS.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (known) setWindowDays(String(known.policyDays));
  }

  /** Reads the product page and fills in anything still empty. */
  async function fetchLink(link: string) {
    const value = link.trim();
    if (!/^https?:\/\//i.test(value)) return;
    setLookup({ state: "loading" });
    try {
      const res = await fetch("/api/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookup({ state: "failed", message: data.error });
        return;
      }
      setTitle((t) => t || data.title || "");
      if (data.shop) setShop((s) => s || data.shop);
      if (data.shop && !shop) pickShop(data.shop);
      setAmount((a) => a || (data.price != null ? String(data.price) : ""));
      setImageUrl((img) => img ?? data.imageUrl ?? null);
      const found = [data.title && "name", data.imageUrl && "photo", data.price != null && "price", data.shop && "shop"].filter(Boolean);
      setLookup({ state: "found", message: found.length ? `Filled in ${found.join(", ")}.` : "Found the page, but no product details." });
    } catch {
      setLookup({ state: "failed", message: "Network error." });
    }
  }

  const errors: FieldErrors & { deliveredOn?: string } = {
    ...validateProduct({
      title,
      type,
      shop,
      price: type !== "collab" ? amount : "",
      fee: type === "collab" ? amount : "",
      deliverables,
      returnWindowDays: windowDays,
      postBy,
      url,
      postUrl: "",
      notes: "",
    }),
    ...(type !== "bought" && postBy && postBy < today() ? { postBy: "This date has already passed" } : {}),
    ...(delivered === "yes" && (!deliveredOn || deliveredOn > today()) ? { deliveredOn: !deliveredOn ? "Pick the day it arrived" : "The arrival date can't be in the future" } : {}),
  };
  const errorCount = Object.keys(errors).length;
  const errorFor = (key: string) => (showAll || touched.has(key) ? (errors as Record<string, string | undefined>)[key] : undefined);
  const check = (key: string, id: string) => ({
    "aria-invalid": Boolean(errorFor(key)),
    "aria-describedby": errorFor(key) ? `${id}-error` : undefined,
    onBlur: () => setTouched((t) => (t.has(key) ? t : new Set(t).add(key))),
  });
  const hasContent = Boolean(url.trim() || title.trim() || shop.trim() || amount || deliverables.trim() || postBy || imageUrl);

  function focusFirstError() {
    const first = FIELD_IDS.find(([key]) => (errors as Record<string, string | undefined>)[key]);
    const el = first && document.getElementById(first[1]);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }

  // Typed something? The first outside click / Esc warns, a second one discards. Empty form closes at once.
  function close() {
    if (hasContent && !discardArmed && !saving) {
      setDiscardArmed(true);
      return;
    }
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (errorCount) {
      setShowAll(true);
      focusFirstError();
      return;
    }
    setError("");
    setSaving(true);
    const err = await createProduct({
      title,
      type,
      shop: shop || null,
      url: url || null,
      imageUrl,
      price: type !== "collab" ? amount || null : null,
      fee: type === "collab" ? amount || null : null,
      deliveredAt: delivered === "yes" ? new Date(deliveredOn).toISOString() : null,
      returnWindowDays: type === "bought" ? windowDays || null : null,
      postBy: type !== "bought" ? postBy || null : null,
      deliverables: type !== "bought" ? deliverables || null : null,
    });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  const shorter = shortTitle(title);
  const shopNames = [...new Set([...shops.map((s) => s.name), ...PLATFORMS.map((p) => p.name)])];

  return (
    <dialog
      ref={ref}
      className="modal modal-lg"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
      onInput={() => discardArmed && setDiscardArmed(false)}
      aria-labelledby="add-title"
    >
      <form className="modal-inner" onSubmit={submit} noValidate>
        <div className="modal-head">
          <div>
            <h2 id="add-title">Add product</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Paste a link to fill things in, or type. Only the name is required.</p>
          </div>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="link-box">
          <label className="label" htmlFor="add-url">Paste a product link</label>
          <div className={`link-row ${errorFor("url") ? "is-invalid" : ""}`}>
            <Icon name="link" size={16} />
            <input
              id="add-url"
              className="link-input"
              type="url"
              inputMode="url"
              placeholder="Paste a link, or the shop app's share text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              {...check("url", "add-url")}
              onPaste={(e) => {
                // Shop apps share "Product name https://…". Keep the name; shops often block reading the page.
                const shared = parseShared(e.clipboardData.getData("text"));
                if (!shared.url) return;
                e.preventDefault();
                setUrl(shared.url);
                if (shared.title) setTitle((t) => t || shared.title!);
                setTimeout(() => fetchLink(shared.url!), 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchLink(url);
                }
              }}
              autoFocus
            />
            <button type="button" className="btn btn-secondary btn-sm" disabled={!url.trim() || lookup.state === "loading"} onClick={() => fetchLink(url)}>
              {lookup.state === "loading" ? "Reading…" : "Fill in"}
            </button>
          </div>
          <FieldError id="add-url" message={errorFor("url")} />
          <span className={`hint ${lookup.state === "failed" ? "is-error" : lookup.state === "found" ? "is-ok" : ""}`} aria-live="polite">
            {lookup.state === "idle" && "We'll fill in the name, photo, price and shop. Or type them below."}
            {lookup.state === "loading" && "Reading the product page…"}
            {lookup.state === "found" && lookup.message}
            {lookup.state === "failed" && (title ? `${lookup.message ?? "Couldn't read that link."} We kept the name. Add the price and a photo or screenshot below.` : `${lookup.message ?? "Couldn't read that link."} Fill in the details below and upload a photo.`)}
          </span>
        </div>

        <PhotoPicker title={title} imageUrl={imageUrl} onChange={setImageUrl} size={84} />

        <div className="field">
          <span className="label" id="add-type">What kind of product?</span>
          <div className="type-picker" role="group" aria-labelledby="add-type">
            {PRODUCT_TYPES.map((t) => (
              <button key={t} type="button" className="type-option" aria-pressed={type === t} onClick={() => setType(t)}>
                <b>{TYPE_LABEL[t]}</b>
                <span>{TYPE_HINT[t]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="add-name">Product name</label>
          <input id="add-name" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dyson Airwrap Complete" maxLength={140} {...check("title", "add-name")} />
          <FieldError id="add-name" message={errorFor("title")} />
          {shorter && (
            <button type="button" className="short-title" onClick={() => setTitle(shorter)}>
              <Icon name="pencil" size={13} /> Use a shorter name: <b>{shorter}</b>
            </button>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="add-shop">{type === "bought" ? "Shop" : "Brand"}</label>
            <input id="add-shop" className="input" list="add-shops" value={shop} onChange={(e) => pickShop(e.target.value)} placeholder={type === "bought" ? "Amazon, Myntra…" : "Brand name"} {...check("shop", "add-shop")} />
            <FieldError id="add-shop" message={errorFor("shop")} />
            <datalist id="add-shops">{shopNames.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="field">
            <label className="label" htmlFor="add-amount">{type === "collab" ? "Fee (₹)" : type === "bought" ? "Price paid (₹)" : "Value (₹, optional)"}</label>
            <input id="add-amount" className="input num" type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} {...check(type === "collab" ? "fee" : "price", "add-amount")} />
            <FieldError id="add-amount" message={errorFor(type === "collab" ? "fee" : "price")} />
          </div>
        </div>

        <div className="field">
          <span className="label" id="add-deliv">Has it arrived?</span>
          <div className="seg" role="group" aria-labelledby="add-deliv">
            <button type="button" aria-pressed={delivered === "no"} onClick={() => setDelivered("no")}>Not yet</button>
            <button type="button" aria-pressed={delivered === "yes"} onClick={() => setDelivered("yes")}>Yes, it arrived</button>
          </div>
          {delivered === "yes" && (
            <>
              <input id="add-arrived" className="input" type="date" aria-label="Arrived on" value={deliveredOn} max={today()} onChange={(e) => setDeliveredOn(e.target.value)} style={{ maxWidth: 220 }} {...check("deliveredOn", "add-arrived")} />
              <FieldError id="add-arrived" message={errorFor("deliveredOn")} />
            </>
          )}
        </div>

        {type === "bought" ? (
          <div className="field">
            <label className="label" htmlFor="add-window">Return window</label>
            <div className="unit-input days" style={{ maxWidth: 160 }}>
              <input id="add-window" className="input num" type="number" min={0} max={365} step={1} inputMode="numeric" value={windowDays} onChange={(e) => setWindowDays(e.target.value)} {...check("returnWindowDays", "add-window")} />
              <span>days</span>
            </div>
            <FieldError id="add-window" message={errorFor("returnWindowDays")} />
            {!errorFor("returnWindowDays") && <span className="hint">Counted from the day it arrives.</span>}
          </div>
        ) : (
          <div className="field-row">
            <div className="field">
              <label className="label" htmlFor="add-postby">Post by</label>
              <input id="add-postby" className="input" type="date" value={postBy} onChange={(e) => setPostBy(e.target.value)} {...check("postBy", "add-postby")} />
              <FieldError id="add-postby" message={errorFor("postBy")} />
            </div>
            <div className="field">
              <label className="label" htmlFor="add-deliverables">Deliverables</label>
              <input id="add-deliverables" className="input" placeholder="e.g. 1 Reel + 2 stories" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} {...check("deliverables", "add-deliverables")} />
              <FieldError id="add-deliverables" message={errorFor("deliverables")} />
            </div>
          </div>
        )}

        {(error || discardArmed || (showAll && errorCount > 0)) && (
          <div className="sheet-msg modal-msg" role="alert">
            <Icon name="alert" size={15} />
            <span>
              {error ||
                (discardArmed
                  ? "You've started adding a product. Close again to discard it, or keep going."
                  : `Fix ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`} to add this product.`)}
            </span>
          </div>
        )}
        <div className="modal-foot">
          <span />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
            <button type="submit" className={`btn ${showAll && errorCount ? "save-btn is-invalid" : "btn-primary"}`} disabled={saving}>
              {saving ? "Adding…" : showAll && errorCount ? `Fix ${errorCount} field${errorCount === 1 ? "" : "s"}` : "Add product"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
