"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { GoogleAuth, authErrorMessage } from "@/components/GoogleAuth";
import { PasswordInput } from "@/components/PasswordInput";
import { PendingLinkNote } from "@/components/PendingLinkNote";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Google sends people back here with ?error=… when something goes wrong.
  useEffect(() => {
    const message = authErrorMessage(new URLSearchParams(window.location.search).get("error"));
    if (message) setError(message);
  }, []);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.replace("/home");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div>
        <h1>Welcome back</h1>
        <p className="muted" style={{ marginTop: 6 }}>Sign in to see what needs you today.</p>
      </div>

      <PendingLinkNote action="Sign in" />

      <GoogleAuth label="Continue with Google" />

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="alert" role="alert">
            <Icon name="alert" size={16} /> {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <div className="label-row">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/auth/forgot" className="label-link">Forgot password?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link href="/auth/signup">Create an account</Link>
      </p>
    </div>
  );
}
