"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { FieldError } from "@/components/FieldError";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ busy?: boolean; done?: string; error?: string; field?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState({ field: email.trim() ? "Enter an email like you@example.com" : "Enter your email" });
      return;
    }
    setState({ busy: true });
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) setState({ error: data?.error ?? "Something went wrong. Try again." });
    else setState({ done: data.message });
  }

  return (
    <div className="auth-card">
      <div>
        <h1>Forgot your password?</h1>
        <p className="muted" style={{ marginTop: 6 }}>Enter your email and we&apos;ll send a link to choose a new one.</p>
      </div>
      {state.done ? (
        <div className="notice" role="status">
          <Icon name="send" size={16} /> {state.done} Check your inbox and spam folder.
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          {state.error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {state.error}</div>}
          <div className="field">
            <label htmlFor="email" className="label">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus aria-invalid={Boolean(state.field)} aria-describedby={state.field ? "email-error" : undefined} />
            <FieldError id="email" message={state.field} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={state.busy}>
            {state.busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="auth-switch"><Link href="/auth/signin">Back to sign in</Link></p>
    </div>
  );
}
