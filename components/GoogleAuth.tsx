"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { GoogleLogo, Icon } from "./Icon";

/** Messages for the `?error=` codes NextAuth sends back to the sign-in page. */
const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email already has a Haulbook account. Sign in with your password, then you can use Google.",
  AccessDenied: "Sign-in was cancelled.",
  OAuthSignin: "Couldn't reach Google or Instagram. Try again.",
  OAuthCallback: "Sign-in didn't finish. With Instagram, use a Business or Creator account.",
  Callback: "Sign-in didn't finish. Try again.",
  CredentialsSignin: "That code isn't right or has expired.",
};
export const authErrorMessage = (code: string | null) => (code ? AUTH_ERRORS[code] ?? "Sign-in didn't work. Try again." : "");

/**
 * The quick way in: one tap with Google creates the account or signs in, whichever applies.
 * Shown first on sign in and sign up. Hidden when Google keys aren't configured
 * (in development a note says so, so it isn't silently missing).
 */
function InstagramLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#fdf497" /><stop offset=".05" stopColor="#fdf497" /><stop offset=".45" stopColor="#fd5949" /><stop offset=".6" stopColor="#d6249f" /><stop offset=".9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-g)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" />
    </svg>
  );
}

/**
 * Quick ways in, shown first on sign in and sign up: Google and Instagram.
 * Each appears only when it's configured (in development a note lists what's missing).
 */
export function GoogleAuth({ label = "Continue with Google" }: { label?: string }) {
  const [providers, setProviders] = useState<Record<string, unknown> | null | "loading">("loading");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getProviders()
      .then((p) => setProviders(p ?? null))
      .catch(() => setProviders(null));
  }, []);

  if (providers === "loading") return <div className="google-slot" aria-hidden="true" />;
  const has = (id: string) => Boolean(providers && id in providers);
  const any = has("google") || has("instagram");
  if (!any) {
    return process.env.NODE_ENV === "development" ? (
      <p className="hint google-dev-note">Google and Instagram sign-in appear here once their keys are set (see docs/LAUNCH.md).</p>
    ) : null;
  }
  const go = (id: string) => {
    setBusy(id);
    signIn(id, { callbackUrl: "/home" });
  };
  return (
    <>
      <div className="quick-signin">
        {has("google") && (
          <button type="button" className="btn btn-google btn-block" disabled={Boolean(busy)} onClick={() => go("google")}>
            <GoogleLogo /> {busy === "google" ? "Opening Google…" : label}
          </button>
        )}
        {has("instagram") && (
          <button type="button" className="btn btn-google btn-block" disabled={Boolean(busy)} onClick={() => go("instagram")}>
            <InstagramLogo /> {busy === "instagram" ? "Opening Instagram…" : label.replace("Google", "Instagram")}
          </button>
        )}
      </div>
      <div className="divider">or use email</div>
    </>
  );
}
