"use client";

import { useEffect, useState } from "react";
import { hasPendingLink } from "@/lib/pendingLink";
import { Icon } from "./Icon";

/** Tells someone arriving from the landing page that the link they pasted is waiting for them. */
export function PendingLinkNote({ action }: { action: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(hasPendingLink()), []);
  if (!show) return null;
  return (
    <p className="pending-note" role="status">
      <Icon name="link" size={14} /> Your product link is saved. {action} and we&apos;ll add it for you.
    </p>
  );
}
