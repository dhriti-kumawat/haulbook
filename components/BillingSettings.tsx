"use client";

import { useEffect, useState } from "react";
import { BILLING_FIELDS, type Billing, type BillingKey } from "@/lib/billing";
import { FieldError } from "./FieldError";
import { ProChip } from "./ProGate";

/** Settings card: the creator's details printed on collab invoices. */
export function BillingSettings() {
  const [saved, setSaved] = useState<Billing | null>(null);
  const [form, setForm] = useState<Billing | null>(null);
  const [errors, setErrors] = useState<Partial<Record<BillingKey, string>>>({});
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/billing").then((r) => (r.ok ? r.json() : null)).then((b) => {
      if (b) {
        setSaved(b);
        setForm(b);
      }
    }).catch(() => {});
  }, []);

  if (!form) return null;
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const res = await fetch("/api/billing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.fields ?? {});
      setState("idle");
      return;
    }
    setErrors({});
    setSaved(data);
    setForm(data);
    setState("saved");
  }

  return (
    <form className="panel-card" onSubmit={save} noValidate>
      <div className="panel-card-head">
        <div>
          <h2>Invoice details <ProChip /></h2>
          <p className="muted">Printed on invoices you send brands for paid collabs. Fill in only what you need.</p>
        </div>
      </div>
      <div className="billing-grid">
        {BILLING_FIELDS.map((f) => {
          const id = `bill-${f.key}`;
          const props = {
            id,
            className: "input",
            value: form[f.key] ?? "",
            placeholder: f.placeholder,
            maxLength: f.max,
            "aria-invalid": Boolean(errors[f.key]),
            "aria-describedby": errors[f.key] ? `${id}-error` : undefined,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setForm({ ...form, [f.key]: e.target.value });
              setState("idle");
            },
          };
          return (
            <div key={f.key} className={`field ${"multiline" in f ? "billing-wide" : ""}`}>
              <label className="label" htmlFor={id}>{f.label}</label>
              {"multiline" in f ? <textarea {...props} className="input textarea" rows={2} /> : <input {...props} />}
              <FieldError id={id} message={errors[f.key]} />
            </div>
          );
        })}
      </div>
      <div className="panel-card-foot">
        <button type="submit" className={`btn btn-sm ${dirty ? "btn-primary" : "save-btn is-saved"}`} disabled={!dirty || state === "saving"}>
          {state === "saving" ? "Saving…" : dirty ? "Save invoice details" : "Saved"}
        </button>
      </div>
    </form>
  );
}
