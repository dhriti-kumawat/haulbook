"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandMark } from "@/components/Icon";

/** Shown when a page crashes, instead of a blank screen. Nothing typed is sent anywhere. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="status-page">
      <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
      <h1>Something went wrong</h1>
      <p className="muted">Your products are safe. Try again, and if it keeps happening, reload the page.</p>
      <div className="status-actions">
        <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
        <Link href="/home" className="btn btn-secondary">Go to your products</Link>
      </div>
    </main>
  );
}
