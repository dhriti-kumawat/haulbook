"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ProductView, StepKey } from "@/lib/products";
import { STEP_FIELD } from "@/lib/products";
import { patchForMove, snapshotSteps } from "@/lib/move";
import { BUCKET_LABEL, type Bucket } from "@/lib/summary";
import { ProductSheet } from "./ProductSheet";
import { AddProductDialog } from "./AddProductDialog";
import { takePendingLink, type PendingLink } from "@/lib/pendingLink";
import { PostLinkDialog } from "./PostLinkDialog";

export interface SavedShop {
  id: string;
  name: string;
  policyDays: number;
}

interface Toast {
  id: number;
  text: string;
  undo?: () => void;
}

export type ProductPatch = Record<string, unknown>;

export interface UserSettings {
  remindersEnabled: boolean;
  reminderDaysBefore: number;
  onboarded: boolean;
  email: string | null;
}

interface Ctx {
  products: ProductView[];
  settings: UserSettings | null;
  finishOnboarding: () => void;
  addSamples: () => Promise<void>;
  removeSamples: () => Promise<void>;
  shops: SavedShop[];
  loading: boolean;
  loadError: boolean;
  busyId: string | null;
  reload: () => void;
  /** Re-fetches in the background, keeping what is on screen (pull to refresh). */
  refresh: () => Promise<void>;
  createProduct: (input: ProductPatch) => Promise<string | null>;
  updateProduct: (id: string, patch: ProductPatch) => Promise<string | null>;
  completeStep: (product: ProductView, step: StepKey) => void;
  keepProduct: (product: ProductView) => void;
  moveProduct: (product: ProductView, to: Bucket) => void;
  moveMany: (products: ProductView[], to: Bucket) => Promise<void>;
  deleteMany: (products: ProductView[]) => void;
  deleteProduct: (product: ProductView) => void;
  saveShop: (shop: { id?: string; name: string; policyDays: number }) => Promise<string | null>;
  removeShop: (shop: SavedShop) => Promise<void>;
  openProduct: (id: string) => void;
  openAdd: () => void;
  showToast: (text: string, undo?: () => void) => void;
}

const ProductsContext = createContext<Ctx | null>(null);

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
  return ctx;
}

const STEP_TOAST: Record<StepKey, string> = {
  delivered: "Marked as delivered",
  filmed: "Marked as filmed",
  posted: "Marked as posted",
  returned: "Marked as returned. We'll watch for the refund.",
  refunded: "Refund received",
  paid: "Payment received",
};

/** Holds the signed-in creator's products and shops, and every action on them. */
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [shops, setShops] = useState<SavedShop[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addUrl, setAddUrl] = useState<PendingLink | null>(null);
  const [postFor, setPostFor] = useState<ProductView | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [res, shopsRes, settingsRes] = await Promise.all([fetch("/api/products"), fetch("/api/shops"), fetch("/api/settings")]);
      if (!res.ok) throw new Error(String(res.status));
      setProducts(await res.json());
      // A link pasted on the landing page before signing up opens straight in Add product.
      const pending = takePendingLink();
      if (pending) {
        setAddUrl(pending);
        setAdding(true);
      }
      if (shopsRes.ok) setShops(await shopsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (err) {
      console.error("Failed to load products:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Send any delete still waiting on its undo window when the app unmounts.
  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        fetch(`/api/products/${id}`, { method: "DELETE", keepalive: true });
      });
    };
  }, []);

  const showToast = useCallback((text: string, undo?: () => void) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const replace = (p: ProductView) => setProducts((list) => list.map((x) => (x.id === p.id ? p : x)));

  async function request(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null);
    if (!res) return { error: "Network error. Try again." };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: (data.error as string) || "Something went wrong." };
    return { data };
  }

  async function createProduct(input: ProductPatch) {
    const { data, error } = await request("/api/products", "POST", input);
    if (error) return error;
    setProducts((list) => [data as ProductView, ...list]);
    showToast(`Added ${(data as ProductView).title}`);
    return null;
  }

  async function updateProduct(id: string, patch: ProductPatch) {
    setBusyId(id);
    const { data, error } = await request(`/api/products/${id}`, "PATCH", patch);
    setBusyId(null);
    if (error) {
      showToast(error);
      return error;
    }
    replace(data as ProductView);
    return null;
  }

  function completeStep(product: ProductView, step: StepKey) {
    if (step === "posted") {
      setPostFor(product);
      return;
    }
    const field = STEP_FIELD[step] as string;
    const previous = (product as unknown as Record<string, unknown>)[field] ?? null;
    updateProduct(product.id, { [field]: new Date().toISOString() }).then((err) => {
      if (!err) showToast(STEP_TOAST[step], () => updateProduct(product.id, { [field]: previous }));
    });
  }

  function keepProduct(product: ProductView) {
    updateProduct(product.id, { keptAt: new Date().toISOString() }).then((err) => {
      if (!err) showToast(`Keeping ${product.title}. No return reminders.`, () => updateProduct(product.id, { keptAt: null }));
    });
  }

  function finishOnboarding() {
    setSettings((s) => (s ? { ...s, onboarded: true } : s));
    request("/api/settings", "PATCH", { onboarded: true });
  }

  async function addSamples() {
    const { data, error } = await request("/api/samples", "POST");
    if (error) return showToast(error);
    setProducts(data as ProductView[]);
    showToast("Added 5 sample products to explore with");
  }

  async function removeSamples() {
    const { error } = await request("/api/samples", "DELETE");
    if (error) return showToast(error);
    setProducts((list) => list.filter((p) => !p.isSample));
    showToast("Sample products removed");
  }

  function moveProduct(product: ProductView, to: Bucket) {
    const patch = patchForMove(product, to);
    if (!patch) return;
    const before = snapshotSteps(product);
    updateProduct(product.id, patch).then((err) => {
      if (!err) showToast(`Moved to ${BUCKET_LABEL[to]}`, () => updateProduct(product.id, before));
    });
  }

  /** Moves several products; ones that can't go to `to` (e.g. PR to "To return") are skipped. */
  async function moveMany(list: ProductView[], to: Bucket) {
    const jobs = list
      .map((p) => ({ p, patch: patchForMove(p, to), before: snapshotSteps(p) }))
      .filter((j) => j.patch);
    const skipped = list.length - jobs.length;
    const results = await Promise.all(jobs.map((j) => request(`/api/products/${j.p.id}`, "PATCH", j.patch)));
    const moved = jobs.filter((_, i) => !results[i].error);
    results.forEach((r) => r.data && replace(r.data as ProductView));
    showToast(
      moved.length
        ? `Moved ${moved.length} to ${BUCKET_LABEL[to]}${skipped ? ` · ${skipped} skipped (already there or no such step)` : ""}`
        : `Nothing moved: ${skipped === 1 ? "it's" : "they're"} already in ${BUCKET_LABEL[to]} or ${skipped === 1 ? "has" : "have"} no such step`,
      moved.length
        ? async () => {
            const undone = await Promise.all(moved.map((j) => request(`/api/products/${j.p.id}`, "PATCH", j.before)));
            undone.forEach((r) => r.data && replace(r.data as ProductView));
          }
        : undefined
    );
  }

  function deleteMany(list: ProductView[]) {
    if (list.length === 1) return deleteProduct(list[0]);
    const ids = new Set(list.map((p) => p.id));
    const snapshot = products;
    setProducts((all) => all.filter((p) => !ids.has(p.id)));
    const timer = setTimeout(async () => {
      list.forEach((p) => pendingDeletes.current.delete(p.id));
      const results = await Promise.all(list.map((p) => fetch(`/api/products/${p.id}`, { method: "DELETE" }).catch(() => null)));
      const failed = list.filter((_, i) => !results[i]?.ok);
      if (failed.length) {
        setProducts((all) => [...failed, ...all]);
        showToast(`Couldn't delete ${failed.length} product${failed.length === 1 ? "" : "s"}.`);
      }
    }, 5000);
    list.forEach((p) => pendingDeletes.current.set(p.id, timer));
    showToast(`Deleted ${list.length} products`, () => {
      clearTimeout(timer);
      list.forEach((p) => pendingDeletes.current.delete(p.id));
      setProducts((all) => {
        const present = new Set(all.map((p) => p.id));
        return [...all, ...snapshot.filter((p) => ids.has(p.id) && !present.has(p.id))].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      });
    });
  }

  function deleteProduct(product: ProductView) {
    setSheetId(null);
    let index = -1;
    setProducts((list) => {
      index = list.findIndex((p) => p.id === product.id);
      return list.filter((p) => p.id !== product.id);
    });
    const restore = () =>
      setProducts((list) => {
        const at = index < 0 ? 0 : Math.min(index, list.length);
        return [...list.slice(0, at), product, ...list.slice(at)];
      });
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(product.id);
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" }).catch(() => null);
      if (!res?.ok) {
        restore();
        showToast("Could not delete the product.");
      }
    }, 5000);
    pendingDeletes.current.set(product.id, timer);
    showToast(`Deleted ${product.title}`, () => {
      clearTimeout(timer);
      pendingDeletes.current.delete(product.id);
      restore();
    });
  }

  async function saveShop(shop: { id?: string; name: string; policyDays: number }) {
    const { data, error } = await request(shop.id ? `/api/shops/${shop.id}` : "/api/shops", shop.id ? "PATCH" : "POST", {
      name: shop.name,
      policyDays: shop.policyDays,
    });
    if (error) return error;
    const saved = data as SavedShop;
    setShops((list) => [...list.filter((s) => s.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(shop.id ? `Saved ${saved.name}` : `Added ${saved.name}`);
    return null;
  }

  async function removeShop(shop: SavedShop) {
    const { error } = await request(`/api/shops/${shop.id}`, "DELETE");
    if (error) return showToast(error);
    setShops((list) => list.filter((s) => s.id !== shop.id));
    showToast(`Removed ${shop.name}`);
  }

  const sheetProduct = products.find((p) => p.id === sheetId) ?? null;

  return (
    <ProductsContext.Provider
      value={{
        products,
        settings,
        finishOnboarding,
        addSamples,
        removeSamples,
        shops,
        loading,
        loadError,
        busyId,
        reload: () => {
          setLoading(true);
          load();
        },
        refresh: load,
        createProduct,
        updateProduct,
        completeStep,
        keepProduct,
        moveProduct,
        moveMany,
        deleteMany,
        deleteProduct,
        saveShop,
        removeShop,
        openProduct: setSheetId,
        openAdd: () => { setAddUrl(null); setAdding(true); },
        showToast,
      }}
    >
      {children}

      <ProductSheet product={sheetProduct} onClose={() => setSheetId(null)} />
      <AddProductDialog open={adding} initialUrl={addUrl?.url} initialTitle={addUrl?.title} onClose={() => { setAdding(false); setAddUrl(null); }} />
      <PostLinkDialog
        product={postFor}
        onClose={() => setPostFor(null)}
        onSave={async (postUrl) => {
          const p = postFor!;
          const err = await updateProduct(p.id, { postedAt: new Date().toISOString(), postUrl: postUrl || null });
          if (!err) {
            setPostFor(null);
            showToast("Marked as posted", () => updateProduct(p.id, { postedAt: null, postUrl: p.postUrl }));
          }
          return err;
        }}
      />

      <div className="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
            {t.undo && (
              <button
                type="button"
                onClick={() => {
                  t.undo!();
                  setToasts((list) => list.filter((x) => x.id !== t.id));
                }}
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ProductsContext.Provider>
  );
}
