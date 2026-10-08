"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductView } from "@/lib/products";
import type { Billing } from "@/lib/billing";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { ProGate } from "@/components/ProGate";

interface InvoiceData {
  product: ProductView;
  billing: Billing;
  invoiceNumber: number;
  invoicedAt: string;
}

const day = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";

/** Printable invoice for one paid collab, from the creator to the brand. */
function Invoice({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}/invoice`)
      .then(async (r) => ((r.ok ? setData(await r.json()) : setError((await r.json().catch(() => ({}))).error ?? "Couldn't load the invoice."))))
      .catch(() => setError("Couldn't load the invoice."));
  }, [id]);

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <div className="skeleton" style={{ height: 420 }} aria-busy="true" />;
  const { product: p, billing: b } = data;
  const missing = !b.billingName || (!b.billingUpi && !b.billingBank);

  return (
    <div className="report invoice">
      <div className="report-actions no-print">
        <button type="button" className="back-link" onClick={() => router.back()}><Icon name="chevronLeft" size={16} /> Back</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      {missing && (
        <p className="pro-banner no-print">
          <Icon name="alert" size={16} /> Add your name and how to pay you in <Link href="/settings">Settings → Invoice details</Link>.
        </p>
      )}

      <header className="invoice-head">
        <div>
          <p className="eyebrow">Invoice</p>
          <h1>#{String(data.invoiceNumber).padStart(4, "0")}</h1>
          <p className="muted">Issued {day(data.invoicedAt)}</p>
        </div>
        <div className="invoice-from">
          <b>{b.billingName ?? "Your name"}</b>
          {b.billingAddress && <span>{b.billingAddress}</span>}
          {b.billingEmail && <span>{b.billingEmail}</span>}
          {b.billingPhone && <span>{b.billingPhone}</span>}
          {b.billingGstin && <span>GSTIN {b.billingGstin}</span>}
          {b.billingPan && <span>PAN {b.billingPan}</span>}
        </div>
      </header>

      <section className="invoice-to">
        <span className="muted">Billed to</span>
        <b>{p.shop ?? "Brand"}</b>
      </section>

      <table className="report-table">
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <b>{p.title}</b>
              {p.deliverables && <div className="muted">{p.deliverables}</div>}
              {p.postedAt && <div className="muted">Posted {day(p.postedAt)}</div>}
              {p.postUrl && <div className="muted">{p.postUrl}</div>}
            </td>
            <td className="num">{p.fee != null ? formatMoney(p.fee) : "–"}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td><b>Total</b></td><td className="num"><b>{p.fee != null ? formatMoney(p.fee) : "–"}</b></td></tr>
        </tfoot>
      </table>

      <section className="invoice-pay">
        {p.paidAt ? (
          <p><b>Paid</b> on {day(p.paidAt)}. Thank you!</p>
        ) : (
          <>
            <b>How to pay</b>
            {b.billingUpi && <span>UPI: {b.billingUpi}</span>}
            {b.billingBank && <span style={{ whiteSpace: "pre-line" }}>{b.billingBank}</span>}
            {!b.billingUpi && !b.billingBank && <span className="muted">Add your UPI ID or bank details in Settings.</span>}
          </>
        )}
      </section>
      <p className="report-foot muted">Made with Haulbook</p>
    </div>
  );
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProGate feature="Invoices">
      <Invoice id={id} />
    </ProGate>
  );
}
