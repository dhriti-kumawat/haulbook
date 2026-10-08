"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductType } from "@/lib/products";
import { PRODUCT_TYPES, TYPE_LABEL } from "@/lib/products";
import { BUCKET_LABEL, bucketOf, urgencyScore, type Bucket } from "@/lib/summary";
import { useIsMobile } from "@/lib/useIsMobile";
import { Icon } from "@/components/Icon";
import { ProductRow } from "@/components/ProductRow";
import { SwipeHint } from "@/components/SwipeHint";
import { Board } from "@/components/Board";
import { BulkBar } from "@/components/BulkBar";
import { Calendar } from "@/components/Calendar";
import { ProChip, ProGate, useHasPro } from "@/components/ProGate";
import { useProducts } from "@/components/ProductsProvider";

const BUCKETS: Bucket[] = ["receive", "film", "post", "return", "money", "done"];

function Products() {
  const { products, loading, openAdd } = useProducts();
  const params = useSearchParams();
  const router = useRouter();
  const mobile = useIsMobile();
  const bucket = (params.get("bucket") as Bucket | null) ?? null;
  const shop = params.get("shop");
  const [type, setType] = useState<ProductType | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const hasPro = useHasPro();
  const [view, setView] = useState<"list" | "board" | "calendar">("list");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) =>
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const stopSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  // Remember the chosen view on this device.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("productsView");
      if (saved === "list" || saved === "board" || saved === "calendar") setView(saved);
    } catch {}
  }, []);
  function changeView(next: "list" | "board" | "calendar") {
    setView(next);
    try {
      localStorage.setItem("productsView", next);
    } catch {}
  }

  function setBucket(b: Bucket | null) {
    const next = new URLSearchParams(params.toString());
    if (b) next.set("bucket", b);
    else next.delete("bucket");
    router.replace(`/products${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  // Keep the selected step tab in view on phones.
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [bucket, mobile]);

  const base = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!type || p.type === type) &&
        (!shop || p.shop?.toLowerCase() === shop.toLowerCase()) &&
        (!q || p.title.toLowerCase().includes(q) || p.shop?.toLowerCase().includes(q))
    );
  }, [products, type, shop, query]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<Bucket, number>;
    base.forEach((p) => c[bucketOf(p)]++);
    return c;
  }, [base]);

  const list = base
    .filter((p) => !bucket || bucketOf(p) === bucket)
    .sort((a, b) => urgencyScore(a) - urgencyScore(b) || b.createdAt.localeCompare(a.createdAt));
  // In "All", finished products fold into a Done group so what needs work stays on top.
  const active = list.filter((p) => p.stage !== "done");
  const finished = list.filter((p) => p.stage === "done");
  const collapseDone = !bucket && !query.trim() && finished.length > 0 && active.length > 0;

  const showBoard = !mobile && view === "board" && products.length > 0;
  const showCalendar = view === "calendar" && products.length > 0;
  const clearAll = () => {
    setType(null);
    setQuery("");
    setBucket(null);
  };

  const stepTabs = (
    <div className={mobile ? "step-tabs" : "pills"} role="group" aria-label="Filter by step" ref={tabsRef}>
      <button type="button" className="pill" aria-pressed={!bucket} onClick={() => setBucket(null)}>
        All <span className="num">{base.length}</span>
      </button>
      {BUCKETS.map((b) => (
        <button key={b} type="button" className="pill" aria-pressed={bucket === b} onClick={() => setBucket(bucket === b ? null : b)}>
          {BUCKET_LABEL[b]} <span className="num">{counts[b]}</span>
        </button>
      ))}
    </div>
  );

  const typeFilter = mobile ? (
    <label className="type-select">
      <span className="sr-only">Product type</span>
      <select value={type ?? ""} onChange={(e) => setType((e.target.value || null) as ProductType | null)}>
        <option value="">All types</option>
        {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
      </select>
      <Icon name="chevronDown" size={14} />
    </label>
  ) : (
    <div className="seg seg-sm" role="group" aria-label="Filter by type">
      <button type="button" aria-pressed={!type} onClick={() => setType(null)}>All types</button>
      {PRODUCT_TYPES.map((t) => (
        <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(type === t ? null : t)}>
          {TYPE_LABEL[t]}
        </button>
      ))}
    </div>
  );

  const searchBox = (
    <label className="search-field">
      <span className="sr-only">Search products</span>
      <Icon name="search" size={15} />
      <input
        className="input"
        type="search"
        placeholder="Search products or shops"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={mobile}
      />
    </label>
  );

  return (
    <>
      <div className="page-head">
        <div>
          {shop && (
            <button type="button" className="back-link" onClick={() => router.push("/shops")}>
              <Icon name="chevronLeft" size={16} /> Shops
            </button>
          )}
          <h1>{shop ?? "Products"}</h1>
          <p className="page-sub">{loading ? "Loading…" : `${base.length} product${base.length === 1 ? "" : "s"}`}</p>
        </div>
        {mobile && (
          <button
            type="button"
            className="icon-btn icon-btn-lg"
            aria-label={view === "calendar" ? "Show list" : "Show dates"}
            aria-pressed={view === "calendar"}
            onClick={() => changeView(view === "calendar" ? "list" : "calendar")}
          >
            <Icon name={view === "calendar" ? "list" : "calendar"} size={19} />
          </button>
        )}
        {mobile ? (
          <button
            type="button"
            className="icon-btn icon-btn-lg"
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((o) => !o);
              setQuery("");
            }}
          >
            <Icon name={searchOpen ? "x" : "search"} size={19} />
          </button>
        ) : null}
        {!selecting && (
          <button type="button" className="btn btn-primary add-fab" onClick={openAdd}>
            <Icon name="plus" size={16} /> Add product
          </button>
        )}
      </div>

      {mobile ? (
        <div className="mobile-filters">
          {searchOpen && searchBox}
          {stepTabs}
          <div className="mobile-filter-row">
            {typeFilter}
            <span style={{ display: "flex", gap: 4 }}>
              {(type || query || bucket) && (
                <button type="button" className="btn btn-quiet btn-sm" onClick={clearAll}>Clear</button>
              )}
              {list.length > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
                  {selecting ? "Cancel" : "Select"}
                </button>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="toolbar">
          <div className="toolbar-row">
            <div className="seg" role="group" aria-label="View">
              <button type="button" aria-pressed={view === "list"} onClick={() => changeView("list")}>
                <Icon name="list" size={15} /> List
              </button>
              <button type="button" aria-pressed={view === "board"} onClick={() => changeView("board")}>
                <Icon name="columns" size={15} /> Board
              </button>
              <button type="button" aria-pressed={view === "calendar"} onClick={() => changeView("calendar")}>
                <Icon name="calendar" size={15} /> Calendar{!hasPro && <ProChip />}
              </button>
            </div>
            <div className="toolbar-actions">
              {view === "list" && list.length > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" aria-pressed={selecting} onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
                  <Icon name="check" size={14} /> {selecting ? "Cancel" : "Select"}
                </button>
              )}
              {searchBox}
              <a href={hasPro ? "/api/export" : "/pro"} className="btn btn-quiet btn-sm" download={hasPro ? true : undefined}>
                <Icon name="download" size={14} /> Export
              </a>
            </div>
          </div>
          {view === "list" && stepTabs}
          <div className="toolbar-row">
            {typeFilter}
            {view === "board" && <span className="hint">Drag a card to another column, or use its move button.</span>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="stack" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 84 }} />)}
        </div>
      ) : showBoard ? (
        <Board products={base} />
      ) : showCalendar ? (
        <ProGate feature="The calendar">
          <Calendar products={base} agenda={mobile} />
        </ProGate>
      ) : list.length === 0 ? (
        <div className="empty">
          <h3>{products.length ? "Nothing here" : "No products yet"}</h3>
          <p>
            {products.length
              ? bucket && !type && !query
                ? `No products in “${BUCKET_LABEL[bucket]}”.`
                : "No products match these filters."
              : "Add the products you're reviewing to get started."}
          </p>
          {products.length ? (
            <button type="button" className="btn btn-secondary" onClick={clearAll}>Show all products</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={16} /> Add product</button>
          )}
        </div>
      ) : (
        <>
          {!selecting && <SwipeHint />}
          <div className="stack">
            {(collapseDone ? active : list).map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                selecting={selecting}
                selected={selectedIds.has(p.id)}
                onToggleSelect={() => toggleSelect(p.id)}
              />
            ))}
          </div>
          {collapseDone && (
            <details className="done-group" open={selecting}>
              <summary>
                <span>Done</span>
                <em className="num">{finished.length}</em>
                <Icon name="chevronDown" size={16} />
              </summary>
              <div className="stack">
                {finished.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    selecting={selecting}
                    selected={selectedIds.has(p.id)}
                    onToggleSelect={() => toggleSelect(p.id)}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {selecting && (
        <BulkBar
          selected={list.filter((p) => selectedIds.has(p.id))}
          total={list.length}
          onSelectAll={() => setSelectedIds(new Set(list.map((p) => p.id)))}
          onDone={stopSelecting}
        />
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <Products />
    </Suspense>
  );
}
