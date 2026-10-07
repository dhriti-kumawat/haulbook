"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TYPE_LABEL } from "@/lib/products";
import { formatDate, formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { useProducts } from "@/components/ProductsProvider";

/** A printable summary of everything done with one brand: what was received, what was posted (with links) and what is owed. */
function Report() {
  const shop = useSearchParams().get("shop") ?? "";
  const router = useRouter();
  const { products, loading } = useProducts();
  const list = useMemo(
    () => products.filter((p) => !p.isSample && p.shop?.toLowerCase() === shop.toLowerCase()).sort((a, b) => a.orderedAt.localeCompare(b.orderedAt)),
    [products, shop]
  );
  const posted = list.filter((p) => p.postedAt);
  const feesDue = list.filter((p) => p.type === "collab" && p.postedAt && !p.paidAt).reduce((s, p) => s + (p.fee ?? 0), 0);
  const feesPaid = list.filter((p) => p.type === "collab" && p.paidAt).reduce((s, p) => s + (p.fee ?? 0), 0);

  return (
    <div className="report">
      <div className="report-actions no-print">
        <button type="button" className="back-link" onClick={() => router.back()}><Icon name="chevronLeft" size={16} /> Back</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>Print or save as PDF</button>
      </div>

      <header className="report-head">
        <p className="eyebrow">Content report · {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}</p>
        <h1>{shop || "Brand"}</h1>
        <p className="page-sub">
          {loading ? "Loading…" : `${list.length} product${list.length === 1 ? "" : "s"} · ${posted.length} posted`}
          {feesPaid > 0 && ` · ${formatMoney(feesPaid)} paid`}
          {feesDue > 0 && ` · ${formatMoney(feesDue)} due`}
        </p>
      </header>

      {!loading && list.length === 0 ? (
        <p className="muted">
          {shop ? `No products from ${shop} yet.` : <>Open a brand on the <Link href="/shops">Shops</Link> page to make its report.</>}
        </p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Type</th>
              <th scope="col">Received</th>
              <th scope="col">Posted</th>
              <th scope="col">Post link</th>
              <th scope="col">Fee</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.title}</b>
                  {p.deliverables && <div className="muted">{p.deliverables}</div>}
                </td>
                <td>{TYPE_LABEL[p.type]}</td>
                <td className="num">{p.deliveredAt ? formatDate(p.deliveredAt) : "—"}</td>
                <td className="num">{p.postedAt ? formatDate(p.postedAt) : p.postBy ? `Due ${formatDate(p.postBy)}` : "—"}</td>
                <td className="report-link">{p.postUrl ? <a href={p.postUrl} target="_blank" rel="noreferrer">{p.postUrl.replace(/^https?:\/\/(www\.)?/, "")}</a> : "—"}</td>
                <td className="num">
                  {p.type === "collab" && p.fee != null ? (
                    <>
                      {formatMoney(p.fee)}
                      <div className="muted">{p.paidAt ? `Paid ${formatDate(p.paidAt)}` : p.postedAt ? "Due" : "On posting"}</div>
                    </>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="report-foot muted">Made with Haulbook</p>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  );
}
