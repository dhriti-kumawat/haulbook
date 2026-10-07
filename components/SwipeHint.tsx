"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const KEY = "haulbook:swipe-hint-seen";

/** One-time tip on touch screens explaining the card swipes. */
export function SwipeHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(window.matchMedia("(pointer: coarse)").matches && !localStorage.getItem(KEY));
    } catch {}
  }, []);
  if (!show) return null;
  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  }
  return (
    <p className="swipe-hint">
      <span>Swipe a card <b>right</b> to do its next step, <b>left</b> to move it.</span>
      <button type="button" className="icon-btn" onClick={dismiss} aria-label="Got it, hide this tip">
        <Icon name="x" size={14} />
      </button>
    </p>
  );
}
