"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PasswordInput } from "@/components/PasswordInput";

const MIN_PASSWORD = 8;

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setState({ error: `Password needs at least ${MIN_PASSWORD} characters` });
      return;
    }
    setState({ busy: true });
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) setState({ error: data?.error ?? "Something went wrong. Try again." });
    else {
      setState({ done: true });
      setTimeout(() => router.replace("/auth/signin"), 1800);
    }
  }

  if (!token) {
    return (
      <div className="auth-card">
        <h1>Link incomplete</h1>
        <p className="muted">Open the link from your email again, or ask for a new one.</p>
        <Link href="/auth/forgot" className="btn btn-primary btn-block">Get a new link</Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div>
        <h1>Choose a new password</h1>
        <p className="muted" style={{ marginTop: 6 }}>At least {MIN_PASSWORD} characters.</p>
      </div>
      {state.done ? (
        <div className="notice" role="status"><Icon name="check" size={16} /> Password updated. Taking you to sign in…</div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {state.error && (
            <div className="alert" role="alert">
              <Icon name="alert" size={16} /> {state.error}
            </div>
          )}
          <div className="field">
            <label htmlFor="password" className="label">New password</label>
            <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={state.busy}>
            {state.busy ? "Saving…" : "Save new password"}
          </button>
          {state.error?.includes("expired") && <Link href="/auth/forgot" className="auth-switch">Ask for a new link</Link>}
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
