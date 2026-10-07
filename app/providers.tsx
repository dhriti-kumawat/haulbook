"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Register the service worker so the app can be installed on phones.
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return <SessionProvider>{children}</SessionProvider>;
}
