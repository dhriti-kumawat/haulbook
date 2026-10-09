"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { FieldError } from "./FieldError";

export interface Logins { password: boolean; providers: string[] }

type Kind = "email";

/** Account card rows: every way to sign in, with add and connect actions. */
export function SignInMethods({ email, logins, onChange }: { email: string | null; logins?: Logins; onChange: () => void }) {
  const [available, setAvailable] = useState<string[]>([]);
  const [open, setOpen] = useState<Kind | null>(null);

  useEffect(() => {
    getProviders().then((p) => setAvailable(Object.keys(p ?? {}))).catch(() => {});
  }, []);

  const connected = (id: string) => logins?.providers.includes(id);
  const row = (label: string, value: React.ReactNode, action?: React.ReactNode) => (
    <li className="login-row">
      <span className="login-label">{label}</span>
      <span className="login-value">{value}</span>
      {action}
    </li>
  );

  return (
    <div className="logins">
      <h3 className="logins-title">Ways to sign in</h3>
      <ul>
        {row(
          "Email",
          email ? <>{email}{logins?.password ? " · with password" : ""}</> : <span className="muted">Not added. Add one to get email reminders.</span>,
          !email && open !== "email" && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen("email")}>Add email</button>,
        )}
        {open === "email" && <AddWithCode kind="email" onDone={() => { setOpen(null); onChange(); }} onCancel={() => setOpen(null)} />}

        {available.includes("google") && row(
          "Google",
          connected("google") ? "Connected" : <span className="muted">Not connected</span>,
          !connected("google") && <button type="button" className="btn btn-secondary btn-sm" onClick={() => signIn("google", { callbackUrl: "/settings" })}>Connect</button>,
        )}
        {available.includes("instagram") && row(
          "Instagram",
          connected("instagram") ? "Connected" : <span className="muted">Not connected</span>,
          !connected("instagram") && <button type="button" className="btn btn-secondary btn-sm" onClick={() => signIn("instagram", { callbackUrl: "/settings" })}>Connect</button>,
        )}
      </ul>
    </div>
  );
}

/** Two steps: the address, then the 6-digit code sent to it. */
function AddWithCode({ kind, onDone, onCancel }: { kind: Kind; onDone: () => void; onCancel: () => void }) {
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const id = `add-${kind}`;

  async function post(body: object) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/account/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return null;
    }
    return data;
  }

  return (
    <li className="login-add">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!sent) {
            if (await post({ [kind]: value })) setSent(true);
          } else if (await post({ [kind]: value, code })) onDone();
        }}
        noValidate
      >
        {!sent ? (
          <>
            <label className="label" htmlFor={id}>Email address</label>
            <input
              id={id}
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
          </>
        ) : (
          <>
            <label className="label" htmlFor={id}>Code sent to {value}</label>
            <input
              id={id}
              className="input code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
          </>
        )}
        <FieldError id={id} message={error} />
        <div className="code-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={sent ? () => { setSent(false); setCode(""); setError(""); } : onCancel}>
            {sent ? "Back" : "Cancel"}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || (sent ? code.length < 6 : !value.trim())}>
            {busy ? "Please wait…" : sent ? "Confirm" : "Send code"}
          </button>
        </div>
      </form>
    </li>
  );
}
