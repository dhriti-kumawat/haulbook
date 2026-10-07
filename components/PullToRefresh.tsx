"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useProducts } from "./ProductsProvider";

const TRIGGER = 70;
const MAX = 110;

/** Pull down at the top of any app page on a touch screen to re-fetch products. */
export function PullToRefresh() {
  const { refresh } = useProducts();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const set = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      const blocked = busyRef.current || window.scrollY > 0 || document.querySelector("dialog[open], .move-backdrop, .sheet.is-open");
      start.current = blocked ? null : e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (start.current == null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) return set(0);
      set(Math.min(MAX, dy * 0.5));
    };
    const onEnd = async () => {
      if (start.current == null) return;
      start.current = null;
      if (pullRef.current < TRIGGER) return set(0);
      busyRef.current = true;
      setBusy(true);
      set(TRIGGER);
      try {
        await refresh();
      } finally {
        busyRef.current = false;
        setBusy(false);
        set(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refresh]);

  if (!pull && !busy) return null;
  const ready = pull >= TRIGGER;
  return (
    <div className="ptr" style={{ transform: `translate(-50%, ${pull - 44}px)` }} role="status" aria-live="polite">
      <span className={`ptr-icon ${busy ? "is-busy" : ""}`} style={busy ? undefined : { transform: `rotate(${pull * 3}deg)` }}>
        <Icon name="undo" size={16} />
      </span>
      <span className="sr-only">{busy ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}</span>
    </div>
  );
}
