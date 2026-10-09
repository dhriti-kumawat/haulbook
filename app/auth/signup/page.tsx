"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { GoogleAuth } from "@/components/GoogleAuth";
import { PasswordInput } from "@/components/PasswordInput";
import { PendingLinkNote } from "@/components/PendingLinkNote";

const MIN_PASSWORD = 8;

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD) {
      setError(`Password needs at least ${MIN_PASSWORD} characters`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not create your account");
        return;
      }

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
        <h1>Create your account</h1>
        <p className="muted" style={{ marginTop: 6 }}>Free. Takes under a minute.</p>
      </div>

      <PendingLinkNote action="Create your account" />

      <GoogleAuth label="Sign up with Google" />

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="alert" role="alert">
            <Icon name="alert" size={16} /> {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="name" className="label">Name</label>
          <input
            id="name"
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

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
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            describedBy="password-hint"
          />
          <span id="password-hint" className="hint" style={tooShort ? { color: "var(--urgent)" } : undefined}>
            At least {MIN_PASSWORD} characters{tooShort ? ` · ${MIN_PASSWORD - password.length} more` : ""}
          </span>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>
      <p className="auth-legal">
        By creating an account you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy policy</Link>.
      </p>
    </div>
  );
}
