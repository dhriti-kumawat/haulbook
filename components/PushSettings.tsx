"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function deviceName() {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "This device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "browser";
  return `${os} · ${browser}`;
}

/**
 * "Phone notifications" card in Settings. Subscribes this device to Web Push and stores it on the server.
 * iPhones only allow it once Haulbook is added to the Home Screen, so they get those steps instead.
 */
export function PushSettings() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad/.test(navigator.userAgent);
      const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !PUBLIC_KEY) {
        return setState(ios && !installed ? "ios-install" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), device: deviceName() }),
      });
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't turn notifications on.");
      }
      setState("on");
      setMessage({ tone: "ok", text: "Notifications are on for this device." });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Couldn't turn notifications on." });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? { tone: "ok", text: "Sent. It should appear in a few seconds." } : { tone: "error", text: data.error ?? "Couldn't send a test." });
    setBusy(false);
  }

  return (
    <section className="panel-card">
      <div className="panel-card-head">
        <div>
          <h2>Phone notifications</h2>
          <p className="muted">A short nudge on this device on days a return, post, refund or payment needs you. Uses the same days-before setting as email.</p>
        </div>
        {(state === "on" || state === "off") && (
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              aria-label="Phone notifications"
              checked={state === "on"}
              disabled={busy}
              onChange={state === "on" ? turnOff : turnOn}
            />
            <span aria-hidden="true" />
          </label>
        )}
      </div>

      {state === "loading" && <p className="hint">Checking this device…</p>}
      {state === "unsupported" && <p className="hint">This browser can&apos;t show notifications. Try Chrome, Edge, Firefox or Safari, or use email reminders.</p>}
      {state === "ios-install" && (
        <ol className="push-steps">
          <li>Tap <b>Share</b> <Icon name="send" size={13} /> in Safari.</li>
          <li>Choose <b>Add to Home Screen</b>.</li>
          <li>Open Haulbook from your Home Screen and come back here to turn notifications on.</li>
        </ol>
      )}
      {state === "denied" && (
        <p className="hint">Notifications are blocked for Haulbook. Allow them in your browser or phone settings for this site, then reload this page.</p>
      )}

      {state === "on" && (
        <div className="panel-card-foot">
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={test}>
            <Icon name="send" size={14} /> Send a test notification
          </button>
        </div>
      )}
      {message && (
        <p className={message.tone === "ok" ? "push-msg is-ok" : "push-msg is-error"} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </section>
  );
}
