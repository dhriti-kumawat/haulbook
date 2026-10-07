"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ busy?: boolean; done?: string; error?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        <form className="auth-form" onSubmit={submit}>
          {state.error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {state.error}</div>}
          <div className="field">
            <label htmlFor="email" className="label">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
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
