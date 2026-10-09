"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FieldError } from "./FieldError";

const pretty = (p: string) => p.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

/** Two steps: mobile number, then the 6-digit code sent by SMS. Creates the account on first use. */
export function PhoneSignIn({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"number" | "code">("number");
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: number }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't send a code.");
    setPhone(data.phone);
    setStep("code");
    setWait(30);
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("phone", { phone, code, redirect: false });
    setBusy(false);
    if (result?.error) return setError(result.error === "CredentialsSignin" ? "That code isn't right or has expired" : result.error);
    router.replace("/home");
  }

  return step === "number" ? (
    <form className="phone-signin" onSubmit={send} noValidate>
      <label className="label" htmlFor="ph-number">Mobile number</label>
      <div className="phone-row">
        <span className="phone-cc">+91</span>
        <input id="ph-number" className="input" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" value={number} onChange={(e) => setNumber(e.target.value)} autoFocus aria-invalid={Boolean(error)} aria-describedby={error ? "ph-number-error" : undefined} />
      </div>
      <FieldError id="ph-number" message={error} />
      <div className="phone-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Back</button>
        <button type="submit" className="btn btn-primary" disabled={busy || number.replace(/\D/g, "").length < 10}>{busy ? "Sending…" : "Send code"}</button>
      </div>
    </form>
  ) : (
    <form className="phone-signin" onSubmit={verify} noValidate>
      <label className="label" htmlFor="ph-code">Code sent to {pretty(phone)}</label>
      <input ref={codeRef} id="ph-code" className="input phone-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={Boolean(error)} aria-describedby={error ? "ph-code-error" : undefined} />
      <FieldError id="ph-code" message={error} />
      <div className="phone-actions">
        <button type="button" className="btn btn-ghost btn-sm" disabled={wait > 0 || busy} onClick={() => send()}>{wait > 0 ? `Resend in ${wait}s` : "Resend code"}</button>
        <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Sign in"}</button>
      </div>
      <button type="button" className="phone-change" onClick={() => { setStep("number"); setCode(""); setError(""); }}>Use a different number</button>
    </form>
  );
}
