"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceProduct } from "@/lib/voiceParse";
import { localDay } from "@/lib/format";
import { Icon } from "./Icon";

// The browser speech API isn't in TypeScript's DOM types yet.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function speechRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const LABELS: Partial<Record<keyof VoiceProduct, string>> = {
  title: "name",
  type: "type",
  shop: "shop",
  amount: "price",
  delivered: "arrival",
  returnWindowDays: "return window",
  postBy: "post date",
  deliverables: "deliverables",
};

/**
 * "Say it" in Add product: the creator describes the product out loud (or types it, where the
 * browser can't listen), and the details fill the form for them to check.
 */
export function VoiceAdd({ onFill }: { onFill: (fields: VoiceProduct) => void }) {
  const [mode, setMode] = useState<"idle" | "listening" | "typing" | "working">("idle");
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const canListen = useRef(false);

  useEffect(() => {
    canListen.current = Boolean(speechRecognition());
    return () => rec.current?.abort();
  }, []);

  async function fill(transcript: string) {
    const said = transcript.trim();
    if (said.length < 3) {
      setMode("idle");
      setMessage({ tone: "error", text: "Didn't catch that. Try again, a little closer to the mic." });
      return;
    }
    setMode("working");
    setMessage(null);
    try {
      const res = await fetch("/api/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: said, today: localDay() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't fill that in.");
      const fields = data.fields as VoiceProduct;
      onFill(fields);
      const got = (Object.keys(LABELS) as (keyof VoiceProduct)[]).filter((k) => fields[k] !== null && fields[k] !== undefined).map((k) => LABELS[k]);
      setMessage(
        got.length
          ? { tone: "ok", text: `Filled in ${got.join(", ")}. Check below, then add it.` }
          : { tone: "error", text: "Couldn't pick out any details. Try saying the name, shop and price." }
      );
      setText("");
      setMode("idle");
    } catch (e) {
      setMode("idle");
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Couldn't fill that in." });
    }
  }

  function listen() {
    const Speech = speechRecognition();
    if (!Speech) {
      setMode("typing");
      return;
    }
    const r = new Speech();
    rec.current = r;
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = true;
    finalText.current = "";
    setText("");
    setMessage(null);
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText.current += `${piece} `;
        else interim += piece;
      }
      setText((finalText.current + interim).trim());
    };
    r.onerror = (e) => {
      setMode("idle");
      setMessage({
        tone: "error",
        text: e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Microphone access is blocked. Allow it for this site, or type it instead."
          : e.error === "no-speech" ? "Didn't hear anything. Tap the mic and try again." : "Listening stopped. Try again or type it instead.",
      });
    };
    r.onend = () => {
      if (rec.current === r) {
        rec.current = null;
        fill(finalText.current);
      }
    };
    r.start();
    setMode("listening");
  }

  function stop() {
    rec.current?.stop();
  }

  return (
    <div className={`voice-add ${mode}`}>
      {mode === "listening" ? (
        <div className="voice-live" aria-live="polite">
          <span className="voice-pulse" aria-hidden="true" />
          <span className="voice-text">{text || "Listening… say the product, shop, price and any dates."}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={stop}>Done</button>
        </div>
      ) : mode === "typing" ? (
        <div className="voice-type">
          <label className="label" htmlFor="voice-text">Describe it the way you&apos;d say it</label>
          <textarea
            id="voice-text"
            className="input textarea"
            rows={2}
            placeholder="e.g. Got the boAt headphones from Amazon for 1999, return in 7 days"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="voice-type-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("idle")}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={text.trim().length < 3} onClick={() => fill(text)}>Fill in</button>
          </div>
        </div>
      ) : (
        <div className="voice-start">
          <button type="button" className="voice-mic" onClick={listen} disabled={mode === "working"} aria-label="Describe the product out loud">
            {mode === "working" ? <span className="save-spinner" aria-hidden="true" /> : <Icon name="mic" size={18} />}
          </button>
          <span className="voice-copy">
            <b>{mode === "working" ? "Filling in the details…" : "Or just say it"}</b>
            <span>&ldquo;Got the boAt headphones from Amazon for ₹1,999, return in 7 days&rdquo;</span>
          </span>
          <button type="button" className="btn btn-quiet btn-sm voice-typebtn" onClick={() => setMode("typing")} disabled={mode === "working"}>
            Type instead
          </button>
        </div>
      )}
      {message && <p className={`voice-msg ${message.tone === "ok" ? "is-ok" : "is-error"}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
    </div>
  );
}
