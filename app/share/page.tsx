"use client";

/** Receives a product shared from a shop app (PWA share target) and opens it in Add product. */
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { savePendingLink } from "@/lib/pendingLink";
import { parseShared } from "@/lib/shareText";

function Share() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Apps put the link in url or inside text, and the name in title or text.
    const shared = parseShared([params.get("title"), params.get("text"), params.get("url")].filter(Boolean).join(" "));
    if (shared.url) savePendingLink(shared.url, shared.title);
    router.replace("/home");
  }, [params, router]);

  return <p style={{ padding: 24 }} className="muted">Opening Haulbook…</p>;
}

export default function SharePage() {
  return (
    <Suspense>
      <Share />
    </Suspense>
  );
}
