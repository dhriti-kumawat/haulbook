"use client";

import { useEffect, useState } from "react";
import { FieldError } from "./FieldError";
import { ProChip } from "./ProGate";

interface WA { available: boolean; number: string | null; on: boolean }

/** Settings card: daily reminders on WhatsApp, with the number and explicit consent. */
export function WhatsAppSettings() {
  const [wa, setWa] = useState<WA | null>(null);
  const [number, setNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<{ field?: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp").then((r) => (r.ok ? r.json() : null)).then((d: WA | null) => {
      if (d) {
        setWa(d);
        setNumber(d.number ?? "");
      }
    }).catch(() => {});
  }, []);
  if (!wa) return null;

  async function update(body: object) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError({ field: data.field, text: data.error ?? "Couldn't save that." });
    setWa(data);
  }

  return (
    <section className="panel-card">
      <div className="panel-card-head">
        <div>
          <h2>WhatsApp reminders <ProChip /></h2>
          <p className="muted">The same short daily nudge, on WhatsApp. Only on days something is due or late.</p>
        </div>
      </div>
      {!wa.available ? (
        <p className="hint">Coming soon.</p>
      ) : wa.on ? (
        <div className="collab-actions" style={{ alignItems: "center" }}>
          <span>On for <b>{wa.number}</b></span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => update({ on: false })}>Turn off</button>
        </div>
      ) : (
        <form
          className="wa-form"
          onSubmit={(e) => {
            e.preventDefault();
            update({ on: true, number, consent });
          }}
          noValidate
        >
          <div className="field">
            <label className="label" htmlFor="wa-number">WhatsApp number</label>
            <input
              id="wa-number"
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              aria-invalid={error?.field === "number"}
              aria-describedby={error?.field === "number" ? "wa-number-error" : undefined}
            />
            <FieldError id="wa-number" message={error?.field === "number" ? error.text : undefined} />
          </div>
          <label className="keep-toggle">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I agree to get reminder messages from Haulbook on WhatsApp. I can turn this off any time.
          </label>
          {error && error.field !== "number" && <p className="field-error" role="alert">{error.text}</p>}
          <div><button type="submit" className="btn btn-primary btn-sm" disabled={busy}>Turn on</button></div>
        </form>
      )}
    </section>
  );
}
