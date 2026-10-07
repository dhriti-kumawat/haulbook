"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { GoogleLogo } from "./Icon";

/** Messages for the `?error=` codes NextAuth sends back to the sign-in page. */
const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email already has a Haulbook account. Sign in with your password, then you can use Google.",
  AccessDenied: "Google sign-in was cancelled.",
  OAuthSignin: "Couldn't reach Google. Try again.",
  OAuthCallback: "Google sign-in didn't finish. Try again.",
  Callback: "Google sign-in didn't finish. Try again.",
};
export const authErrorMessage = (code: string | null) => (code ? AUTH_ERRORS[code] ?? "Sign-in didn't work. Try again." : "");

/**
 * The quick way in: one tap with Google creates the account or signs in, whichever applies.
 * Shown first on sign in and sign up. Hidden when Google keys aren't configured
 * (in development a note says so, so it isn't silently missing).
 */
export function GoogleAuth({ label = "Continue with Google" }: { label?: string }) {
  const [state, setState] = useState<"loading" | "on" | "off">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProviders()
      .then((p) => setState(p?.google ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  if (state === "loading") return <div className="google-slot" aria-hidden="true" />;
  if (state === "off") {
    return process.env.NODE_ENV === "development" ? (
      <p className="hint google-dev-note">Google sign-in appears here once GOOGLE_ID and GOOGLE_SECRET are set (see docs/LAUNCH.md).</p>
    ) : null;
  }
  return (
    <>
      <button
        type="button"
        className="btn btn-google btn-block"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          signIn("google", { callbackUrl: "/home" });
        }}
      >
        <GoogleLogo /> {busy ? "Opening Google…" : label}
      </button>
      <div className="divider">or use email</div>
    </>
  );
}
