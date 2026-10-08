"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { activeYears, fyLabel, fyOf, incomeFor } from "@/lib/income";
import { Icon } from "@/components/Icon";
import { ProChip, ProGate } from "@/components/ProGate";
import { useProducts } from "@/components/ProductsProvider";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export default function EarningsPage() {
  const { products, loading } = useProducts();
  const years = useMemo(() => activeYears(products), [products]);
  const [fy, setFy] = useState(() => fyOf(new Date()));
  const s = useMemo(() => incomeFor(products, fy), [products, fy]);
  const maxMonth = Math.max(1, ...s.months);

  function download() {
    const lines = [
      ["Date", "What", "Product", "Brand or shop", "Amount (₹)"].map(cell).join(","),
      ...s.items.map((i) => [i.date, i.kind, i.product, i.brand, i.amount].map(cell).join(",")),
      "",
      ["Brand or shop", "Fees earned", "Fees due", "Refunds recovered", "Refunds pending", "PR value received", "Spent"].map(cell).join(","),
      ...s.brands.map((b) => [b.brand, b.feesEarned, b.feesDue, b.refundsRecovered, b.refundsPending, b.prValue, b.spent].map(cell).join(",")),
    ];
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `haulbook-earnings-${fyLabel(fy).replace(/\s/g, "-")}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Earnings <ProChip /></h1>
          <p className="page-sub">Fees earned, refunds recovered and what&apos;s still owed, by financial year.</p>
        </div>
      </div>

      <ProGate feature="Earnings">
        <div className="income-bar">
          <label className="label" htmlFor="fy">Financial year</label>
          <select id="fy" className="input input-sm" value={fy} onChange={(e) => setFy(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{fyLabel(y)} (Apr–Mar)</option>)}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={download} disabled={loading || !s.items.length}>
            <Icon name="download" size={14} /> Download for tax (CSV)
          </button>
        </div>

        <div className="income-tiles" aria-busy={loading}>
          <div className="income-tile is-main">
            <span>Collab fees earned</span>
            <b className="num">{formatMoney(s.feesEarned)}</b>
            <em>{s.feesDue ? `${formatMoney(s.feesDue)} still due` : "Nothing due right now"}</em>
          </div>
          <div className="income-tile">
            <span>Refunds recovered</span>
            <b className="num">{formatMoney(s.refundsRecovered)}</b>
            <em>{s.refundsPending ? `${formatMoney(s.refundsPending)} pending` : "None pending"}</em>
          </div>
          <div className="income-tile">
            <span>PR products received</span>
            <b className="num">{formatMoney(s.prValue)}</b>
            <em>Value of gifted products</em>
          </div>
          <div className="income-tile">
            <span>Spent on products</span>
            <b className="num">{formatMoney(s.spent)}</b>
            <em>{s.keptValue ? `${formatMoney(s.keptValue)} of it kept` : "Bought to review"}</em>
          </div>
        </div>

        <section className="panel-card">
          <div className="panel-card-head"><h2>Fees by month</h2></div>
          <div className="income-months" role="img" aria-label={`Collab fees per month in ${fyLabel(fy)}`}>
            {s.months.map((v, i) => (
              <div key={MONTHS[i]} className="income-month">
                <span className="income-bar-fill" style={{ height: `${Math.round((v / maxMonth) * 100)}%` }} title={formatMoney(v)} />
                <em>{MONTHS[i]}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-card-head"><h2>By brand</h2></div>
          {s.brands.length ? (
            <div className="income-table-wrap">
              <table className="report-table income-table">
                <thead>
                  <tr><th>Brand or shop</th><th>Fees earned</th><th>Fees due</th><th>Refunds</th><th>PR value</th></tr>
                </thead>
                <tbody>
                  {s.brands.map((b) => (
                    <tr key={b.brand}>
                      <td><b>{b.brand}</b><div className="muted">{b.products} product{b.products === 1 ? "" : "s"}</div></td>
                      <td className="num">{b.feesEarned ? formatMoney(b.feesEarned) : "–"}</td>
                      <td className="num">{b.feesDue ? formatMoney(b.feesDue) : "–"}</td>
                      <td className="num">{b.refundsRecovered ? formatMoney(b.refundsRecovered) : "–"}{b.refundsPending ? <div className="muted">{formatMoney(b.refundsPending)} pending</div> : null}</td>
                      <td className="num">{b.prValue ? formatMoney(b.prValue) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Nothing in {fyLabel(fy)} yet. Paid collabs, refunds and PR products will show up here.</p>
          )}
          <p className="hint">For your records, not tax advice. Gifted PR products can count as income; check with your CA.</p>
        </section>
      </ProGate>
    </>
  );
}
